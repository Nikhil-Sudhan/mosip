const { pool } = require('../db');
const { v4: uuid } = require('uuid');
const QRCode = require('qrcode');
const batchService = require('./batchService');
const config = require('../config');
const auditService = require('./auditService');
const injiCertifyService = require('./injiCertifyService');
const injiWalletService = require('./injiWalletService');
const userService = require('./userService');

/**
 * Credential Service - Handles VC issuance with PostgreSQL and Inji integrations
 */

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildInspectionPayload(batch = {}) {
  const defaults = {
    moisturePercent: 11.3,
    pesticidePPM: 0.05,
    organicStatus: 'India Organic Certified',
    isoCode: 'ISO 22000',
    result: 'PASS',
  };

  const recorded = batch.inspection || {};
  return {
    moisturePercent:
      typeof recorded.moisture_percent === 'number'
        ? recorded.moisture_percent
        : defaults.moisturePercent,
    pesticidePPM:
      typeof recorded.pesticide_ppm === 'number'
        ? recorded.pesticide_ppm
        : defaults.pesticidePPM,
    organicStatus: recorded.organic_status || defaults.organicStatus,
    isoCode: recorded.iso_code || defaults.isoCode,
    result: recorded.result || defaults.result,
  };
}

function buildCredentialPayload(batch, issuerDid, issuedAt, expiresAt, credentialId) {
  return {
    id: credentialId,
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schema.org',
      'https://mosip.io/dpp/v1',
    ],
    type: ['VerifiableCredential', 'DigitalProductPassport'],
    issuer: issuerDid,
    issuanceDate: issuedAt,
    expirationDate: expiresAt,
    credentialSubject: {
      id: `did:example:batch-${batch.id}`,
      product: {
        name: batch.product_type,
        variety: batch.variety,
        batchNumber: batch.batch_number,
        quantity: `${batch.quantity} ${batch.unit}`,
        origin: batch.origin_country,
        destination: batch.destination_country,
      },
      inspection: buildInspectionPayload(batch),
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: issuedAt,
      proofPurpose: 'assertionMethod',
      verificationMethod: `${issuerDid}#key-1`,
      jws: toBase64Url(`${credentialId}:${issuedAt}`),
    },
  };
}

function sanitizeForDid(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'qa-agency';
}

async function getCredentialById(id) {
  const result = await pool.query(
    'SELECT * FROM credentials WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }

  const cred = result.rows[0];
  return {
    id: cred.id,
    batchId: cred.batch_id,
    issuer: cred.issuer_did,
    issuedBy: cred.issued_by,
    issuedAt: cred.issued_at,
    expiresAt: cred.expires_at,
    status: cred.status,
    qrUrl: cred.qr_url,
    qrPortalUrl: cred.qr_portal_url,
    qrImage: cred.qr_image,
    credentialJson: cred.credential_json,
    walletShared: cred.wallet_shared,
    walletSharedAt: cred.wallet_shared_at,
  };
}

async function issueCredential(user, batchId, esignetAccessToken = null) {
  const batch = await batchService.getBatchById(user, batchId);
  if (!batch) {
    throw new Error('BATCH_NOT_FOUND');
  }

  if (batch.status === 'REJECTED') {
    throw new Error('BATCH_REJECTED');
  }

  if (batch.status !== 'INSPECTED') {
    throw new Error('BATCH_NOT_INSPECTED');
  }

  if (!batch.inspection || batch.inspection.result !== 'PASS') {
    throw new Error('INSPECTION_NOT_PASSED');
  }

  const existingCredential = await getCredentialForBatch(user, batchId);
  if (existingCredential && existingCredential.status === 'ACTIVE') {
    throw new Error('CREDENTIAL_ALREADY_ISSUED');
  }

  const issuerDid = config.injiCertify.issuerDid || `did:example:${sanitizeForDid(user.organization || user.role)}`;
  const issuedDate = new Date();
  const expiresDate = new Date(issuedDate);
  expiresDate.setFullYear(expiresDate.getFullYear() + 1);
  const issuedAt = issuedDate.toISOString();
  const expiresAt = expiresDate.toISOString();
  let credentialId = uuid();

  // Build credential subject data
  const credentialSubject = {
    id: `did:example:batch-${batch.id}`,
    product: {
      name: batch.product_type,
      variety: batch.variety,
      batchNumber: batch.batch_number,
      quantity: `${batch.quantity} ${batch.unit}`,
      origin: batch.origin_country,
      destination: batch.destination_country,
    },
    inspection: buildInspectionPayload(batch),
  };

  let credentialJson;

  // Use INJI Certify if access token is provided and config is set
  if (esignetAccessToken && config.injiCertify.baseUrl && config.injiCertify.apiKey) {
    try {
      // Issue credential using INJI Certify
      credentialJson = await injiCertifyService.issueCredential(
        {
          credentialSubject: credentialSubject,
          type: ['VerifiableCredential', 'DigitalProductPassport'],
          expirationDate: expiresAt,
        },
        esignetAccessToken
      );
      
      // Update credential ID and dates from INJI response
      credentialId = credentialJson.id || credentialId;
      issuedAt = credentialJson.issuanceDate || issuedAt;
      expiresAt = credentialJson.expirationDate || expiresAt;
    } catch (error) {
      // Fallback to manual generation if INJI Certify fails
      console.warn('INJI Certify failed, using fallback:', error.message);
      credentialJson = buildCredentialPayload(
        batch,
        issuerDid,
        issuedAt,
        expiresAt,
        credentialId
      );
    }
  } else {
    // Fallback: Build credential manually (for backward compatibility)
    credentialJson = buildCredentialPayload(
      batch,
      issuerDid,
      issuedAt,
      expiresAt,
      credentialId
    );
  }

  const verificationUrl = `${config.publicUrl}/api/verify/${credentialId}`;
  const qrPortalUrl = `${config.verifyPortalUrl}?credential=${credentialId}`;
  const qrImage = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 256,
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Save credential to database
    const credResult = await client.query(`
      INSERT INTO credentials (
        id, batch_id, issuer_did, issued_by, credential_json,
        qr_url, qr_portal_url, qr_image, status, issued_at, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      credentialId,
      batchId,
      credentialJson.issuer || issuerDid,
      user.id,
      credentialJson,
      verificationUrl,
      qrPortalUrl,
      qrImage,
      'ACTIVE',
      issuedAt,
      expiresAt,
    ]);

    // Mark batch as certified
    await batchService.markBatchCertified(batchId, user);

    // Share to Inji Wallet if configured
    let walletShared = false;
    if (esignetAccessToken && config.injiWallet.baseUrl) {
      try {
        const exporter = await userService.getUserById(batch.exporter_id);
        if (exporter && exporter.email) {
          await injiWalletService.shareCredentialToWallet(
            credentialJson,
            exporter.email,
            esignetAccessToken
          );
          walletShared = true;
          
          // Update credential with wallet sharing status
          await client.query(`
            UPDATE credentials
            SET wallet_shared = TRUE, wallet_shared_at = NOW()
            WHERE id = $1
          `, [credentialId]);
        }
      } catch (error) {
        console.warn('Wallet sharing failed:', error.message);
        // Continue even if wallet sharing fails
      }
    }

    await client.query('COMMIT');

    await auditService.logAction('credential.issued', {
      userId: user.id,
      role: user.role,
      entityType: 'CREDENTIAL',
      entityId: credentialId,
      metadata: { batchId, walletShared },
    });

    const credentialRecord = {
      id: credentialId,
      batchId,
      issuer: credentialJson.issuer || issuerDid,
      issuedBy: user.id,
      issuedAt,
      expiresAt,
      status: 'ACTIVE',
      qrUrl: verificationUrl,
      qrPortalUrl,
      qrImage,
      credentialJson,
      walletShared,
    };

    return credentialRecord;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getCredentialForBatch(user, batchId) {
  const batch = await batchService.getBatchById(user, batchId);
  if (!batch) {
    return null;
  }
  
  const result = await pool.query(
    'SELECT * FROM credentials WHERE batch_id = $1 ORDER BY issued_at DESC LIMIT 1',
    [batchId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }

  const cred = result.rows[0];
  return {
    id: cred.id,
    batchId: cred.batch_id,
    issuer: cred.issuer_did,
    issuedBy: cred.issued_by,
    issuedAt: cred.issued_at,
    expiresAt: cred.expires_at,
    status: cred.status,
    qrUrl: cred.qr_url,
    qrPortalUrl: cred.qr_portal_url,
    qrImage: cred.qr_image,
    credentialJson: cred.credential_json,
    walletShared: cred.wallet_shared,
  };
}

async function revokeCredential(user, batchId, reason = 'Revoked by admin') {
  const result = await pool.query(`
    UPDATE credentials
    SET 
      status = 'REVOKED',
      revoked_at = NOW(),
      revoked_by = $1,
      revocation_reason = $2
    WHERE batch_id = $3 AND status = 'ACTIVE'
    RETURNING *
  `, [user.id, reason, batchId]);

  if (result.rows.length === 0) {
    return null;
  }

  const cred = result.rows[0];
  await auditService.logAction('credential.revoked', {
    userId: user.id,
    role: user.role,
    entityType: 'CREDENTIAL',
    entityId: cred.id,
    metadata: { batchId, reason },
  });

  return {
    id: cred.id,
    batchId: cred.batch_id,
    status: cred.status,
    revokedAt: cred.revoked_at,
    revokedBy: cred.revoked_by,
    revocationReason: cred.revocation_reason,
  };
}

module.exports = {
  issueCredential,
  getCredentialForBatch,
  getCredentialById,
  revokeCredential,
};
