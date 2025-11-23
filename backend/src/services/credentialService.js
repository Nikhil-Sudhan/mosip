const path = require('path');
const { v4: uuid } = require('uuid');
const QRCode = require('qrcode');
const { ensureJSON, readJSON, writeJSON } = require('../lib/fileStore');
const batchService = require('./batchService');
const config = require('../config');
const auditService = require('./auditService');

const STORE_PATH = path.join(__dirname, '..', 'data', 'credentials.json');

async function initStore() {
  await ensureJSON(STORE_PATH, []);
}

async function getAllCredentials() {
  await initStore();
  return readJSON(STORE_PATH, []);
}

async function saveCredentials(credentials) {
  await writeJSON(STORE_PATH, credentials);
}

async function getCredentialById(id) {
  const credentials = await getAllCredentials();
  return credentials.find((item) => item.id === id) || null;
}

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
      typeof recorded.moisturePercent === 'number'
        ? recorded.moisturePercent
        : defaults.moisturePercent,
    pesticidePPM:
      typeof recorded.pesticidePPM === 'number'
        ? recorded.pesticidePPM
        : defaults.pesticidePPM,
    organicStatus: recorded.organicStatus || defaults.organicStatus,
    isoCode: recorded.isoCode || defaults.isoCode,
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
        name: batch.productType,
        variety: batch.variety,
        batchNumber: batch.id.slice(0, 8).toUpperCase(),
        quantity: `${batch.quantity} ${batch.unit}`,
        origin: batch.originCountry,
        destination: batch.destinationCountry,
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

async function issueCredential(user, batchId) {
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

  const issuerDid = `did:example:${sanitizeForDid(user.organization || user.role)}`;
  const issuedDate = new Date();
  const expiresDate = new Date(issuedDate);
  expiresDate.setFullYear(expiresDate.getFullYear() + 1);
  const issuedAt = issuedDate.toISOString();
  const expiresAt = expiresDate.toISOString();
  const credentialId = uuid();
  const credentialJson = buildCredentialPayload(
    batch,
    issuerDid,
    issuedAt,
    expiresAt,
    credentialId
  );

  const verificationUrl = `${config.publicUrl}/api/verify/${credentialId}`;
  const qrPortalUrl = `${config.verifyPortalUrl}?credential=${credentialId}`;
  const qrImage = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 256,
  });

  const credentials = await getAllCredentials();
  const filtered = credentials.filter((item) => item.batchId !== batchId);
  const credentialRecord = {
    id: credentialId,
    batchId,
    issuer: issuerDid,
    issuedBy: user.id,
    issuedAt,
    expiresAt,
    status: 'ACTIVE',
    qrUrl: verificationUrl,
    qrPortalUrl,
    qrImage,
    credentialJson,
  };
  filtered.push(credentialRecord);
  await saveCredentials(filtered);
  await batchService.markBatchCertified(batchId, user);
  await auditService.logAction('credential.issued', {
    userId: user.id,
    role: user.role,
    entityType: 'CREDENTIAL',
    entityId: credentialId,
    metadata: { batchId },
  });
  return credentialRecord;
}

async function getCredentialForBatch(user, batchId) {
  const batch = await batchService.getBatchById(user, batchId);
  if (!batch) {
    return null;
  }
  const credentials = await getAllCredentials();
  return credentials.find((item) => item.batchId === batchId) || null;
}

async function revokeCredential(user, batchId, reason = 'Revoked by admin') {
  const credentials = await getAllCredentials();
  const index = credentials.findIndex((item) => item.batchId === batchId);
  if (index === -1) {
    return null;
  }
  const credential = credentials[index];
  credential.status = 'REVOKED';
  credential.revokedAt = new Date().toISOString();
  credential.revokedBy = user.id;
  credential.revocationReason = reason;
  credentials[index] = credential;
  await saveCredentials(credentials);
  await auditService.logAction('credential.revoked', {
    userId: user.id,
    role: user.role,
    entityType: 'CREDENTIAL',
    entityId: credential.id,
    metadata: { batchId, reason },
  });
  return credential;
}

module.exports = {
  issueCredential,
  getCredentialForBatch,
  getCredentialById,
  revokeCredential,
};


