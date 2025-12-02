const { pool } = require('../db');
const axios = require('axios');
const credentialService = require('./credentialService');
const auditService = require('./auditService');
const injiCertifyService = require('./injiCertifyService');
const config = require('../config');

/**
 * Verification Service - Handles credential verification with PostgreSQL and Inji Verify
 */

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function computeSignatureSeed(credentialId, issuedAt) {
  return base64Url(`${credentialId}:${issuedAt}`);
}

function summarizeCredential(credentialRecord) {
  if (!credentialRecord) {
    return null;
  }
  const subject = credentialRecord.credentialJson?.credentialSubject || {};
  const product = subject.product || {};
  const origin = product.origin || 'N/A';
  const destination = product.destination || 'N/A';
  return {
    issuer: credentialRecord.issuer,
    batchId: credentialRecord.batchId,
    credentialId: credentialRecord.id,
    productName: product.name,
    quantity: product.quantity,
    route: `${origin} → ${destination}`,
    inspection: subject.inspection || null,
    issuedAt: credentialRecord.issuedAt,
    expiresAt: credentialRecord.expiresAt,
  };
}

/**
 * Verify credential using Inji Verify API if available
 */
async function verifyWithInjiVerify(credentialId, accessToken) {
  if (!config.injiVerify.baseUrl || !config.injiVerify.apiKey) {
    return null;
  }

  try {
    const response = await axios.get(
      `${config.injiVerify.baseUrl}/api/v1/verify/${credentialId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-API-Key': config.injiVerify.apiKey,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.warn('Inji Verify API call failed:', error.message);
    return null;
  }
}

async function evaluateRecord(credentialRecord, accessToken = null) {
  if (!credentialRecord) {
    return {
      verdict: 'NOT_FOUND',
      checks: {
        signature: false,
        expiry: false,
        revocation: false,
      },
      summary: null,
    };
  }

  const now = new Date();
  const expiresAt = new Date(credentialRecord.expiresAt);
  const isExpired = now > expiresAt;
  const isRevoked = credentialRecord.status === 'REVOKED';
  
  let signatureValid = false;
  
  // Try Inji Verify first if available
  if (accessToken && config.injiVerify.baseUrl && credentialRecord.id) {
    const injiResult = await verifyWithInjiVerify(credentialRecord.id, accessToken);
    if (injiResult && injiResult.verified === true) {
      signatureValid = true;
    }
  }

  // Fallback to Inji Certify verification
  if (!signatureValid && accessToken && config.injiCertify.baseUrl && config.injiCertify.apiKey && credentialRecord.credentialJson) {
    try {
      const verificationResult = await injiCertifyService.verifyCredential(
        credentialRecord.credentialJson,
        accessToken
      );
      signatureValid = verificationResult.verified === true;
    } catch (error) {
      // Fallback to simple check if INJI verification fails
      console.warn('INJI verification failed, using fallback:', error.message);
      const expectedSignature = computeSignatureSeed(
        credentialRecord.id,
        credentialRecord.issuedAt
      );
      signatureValid = credentialRecord.credentialJson?.proof?.jws === expectedSignature;
    }
  } else if (!signatureValid) {
    // Fallback: Simple signature check (for backward compatibility)
    const expectedSignature = computeSignatureSeed(
      credentialRecord.id,
      credentialRecord.issuedAt
    );
    signatureValid = credentialRecord.credentialJson?.proof?.jws === expectedSignature;
  }

  let verdict = 'VALID';
  if (!signatureValid) {
    verdict = 'TAMPERED';
  } else if (isRevoked) {
    verdict = 'REVOKED';
  } else if (isExpired) {
    verdict = 'EXPIRED';
  }

  return {
    verdict,
    checks: {
      signature: signatureValid,
      expiry: !isExpired,
      revocation: !isRevoked,
    },
    summary: summarizeCredential(credentialRecord),
    credential: credentialRecord.credentialJson,
  };
}

async function appendActivity(entry) {
  await pool.query(`
    INSERT INTO verification_activity (credential_id, verdict, actor, product, route)
    VALUES ($1, $2, $3, $4, $5)
  `, [
    entry.credentialId,
    entry.verdict,
    entry.actor || 'ANON',
    entry.product || null,
    entry.route || null,
  ]);
}

async function verifyCredentialById(credentialId, actor = null, accessToken = null) {
  const credentialRecord = await credentialService.getCredentialById(credentialId);
  const evaluation = await evaluateRecord(credentialRecord, accessToken);
  
  await appendActivity({
    credentialId,
    verdict: evaluation.verdict,
    actor: actor?.role || 'ANON',
    product: evaluation.summary?.productName || null,
    route: evaluation.summary?.route || null,
  });
  
  await auditService.logAction('verification.performed', {
    userId: actor?.id || null,
    role: actor?.role || 'ANON',
    entityType: 'CREDENTIAL',
    entityId: credentialId,
    metadata: { verdict: evaluation.verdict },
  });
  
  return evaluation;
}

async function evaluateUploadedCredential(credentialJson, accessToken = null) {
  if (!credentialJson || typeof credentialJson !== 'object') {
    return {
      verdict: 'INVALID_SCHEMA',
      checks: {
        signature: false,
        expiry: false,
        revocation: false,
      },
      summary: null,
      credential: null,
    };
  }
  const issuedAt = credentialJson.issuanceDate;
  const expiresAt = credentialJson.expirationDate;
  const now = new Date();
  const isExpired = expiresAt ? now > new Date(expiresAt) : false;
  
  let signatureValid = false;
  
  // Use INJI Certify verification if available
  if (accessToken && config.injiCertify.baseUrl && config.injiCertify.apiKey) {
    try {
      const verificationResult = await injiCertifyService.verifyCredential(
        credentialJson,
        accessToken
      );
      signatureValid = verificationResult.verified === true;
    } catch (error) {
      // Fallback to simple check if INJI verification fails
      console.warn('INJI verification failed, using fallback:', error.message);
      const expectedSignature =
        credentialJson.id && issuedAt
          ? computeSignatureSeed(credentialJson.id, issuedAt)
          : null;
      signatureValid =
        Boolean(expectedSignature) &&
        credentialJson.proof?.jws === expectedSignature;
    }
  } else {
    // Fallback: Simple signature check
    const expectedSignature =
      credentialJson.id && issuedAt
        ? computeSignatureSeed(credentialJson.id, issuedAt)
        : null;
    signatureValid =
      Boolean(expectedSignature) &&
      credentialJson.proof?.jws === expectedSignature;
  }

  const summary = {
    issuer: credentialJson.issuer,
    batchId: credentialJson.credentialSubject?.id,
    credentialId: credentialJson.id,
    productName: credentialJson.credentialSubject?.product?.name,
    quantity: credentialJson.credentialSubject?.product?.quantity,
    route: credentialJson.credentialSubject?.product?.destination
      ? `${credentialJson.credentialSubject?.product?.origin || 'N/A'} → ${
          credentialJson.credentialSubject?.product?.destination
        }`
      : null,
    inspection: credentialJson.credentialSubject?.inspection || null,
    issuedAt,
    expiresAt,
  };

  let verdict = 'VALID_OFFLINE';
  if (!signatureValid) {
    verdict = 'INVALID_SIGNATURE';
  } else if (isExpired) {
    verdict = 'EXPIRED';
  }

  return {
    verdict,
    checks: {
      signature: signatureValid,
      expiry: !isExpired,
      revocation: true, // cannot check without registry
    },
    summary,
    credential: credentialJson,
  };
}

async function verifyCredentialUpload(credentialJson, actor = null, accessToken = null) {
  const evaluation = await evaluateUploadedCredential(credentialJson, accessToken);
  await auditService.logAction('verification.upload', {
    userId: actor?.id || null,
    role: actor?.role || 'ANON',
    entityType: 'CREDENTIAL',
    entityId: credentialJson?.id || null,
    metadata: { verdict: evaluation.verdict },
  });
  return evaluation;
}

async function listActivity(limit = 20) {
  const result = await pool.query(`
    SELECT * FROM verification_activity
    ORDER BY checked_at DESC
    LIMIT $1
  `, [limit]);
  
  return result.rows.map(row => ({
    id: row.id,
    credentialId: row.credential_id,
    verdict: row.verdict,
    actor: row.actor,
    product: row.product,
    route: row.route,
    checkedAt: row.checked_at,
  }));
}

module.exports = {
  verifyCredentialById,
  verifyCredentialUpload,
  listActivity,
};
