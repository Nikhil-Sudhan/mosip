const path = require('path');
const { ensureJSON, readJSON, writeJSON } = require('../lib/fileStore');
const credentialService = require('./credentialService');
const auditService = require('./auditService');
const injiCertifyService = require('./injiCertifyService');
const config = require('../config');

const ACTIVITY_FILE = path.join(__dirname, '..', 'data', 'verifications.json');

async function ensureActivityStore() {
  await ensureJSON(ACTIVITY_FILE, []);
}

async function getActivityLog() {
  await ensureActivityStore();
  return readJSON(ACTIVITY_FILE, []);
}

async function saveActivityLog(entries) {
  await writeJSON(ACTIVITY_FILE, entries);
}

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
  
  // Use INJI Certify verification if available
  if (accessToken && config.injiCertify.baseUrl && config.injiCertify.apiKey && credentialRecord.credentialJson) {
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
  } else {
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
  const log = await getActivityLog();
  log.push(entry);
  const trimmed = log.slice(-100);
  await saveActivityLog(trimmed);
}

async function verifyCredentialById(credentialId, actor = null, accessToken = null) {
  const credentialRecord = await credentialService.getCredentialById(credentialId);
  const evaluation = await evaluateRecord(credentialRecord, accessToken);
  await appendActivity({
    id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    credentialId,
    verdict: evaluation.verdict,
    checkedAt: new Date().toISOString(),
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
  const log = await getActivityLog();
  return log.slice(-limit).reverse();
}

module.exports = {
  verifyCredentialById,
  verifyCredentialUpload,
  listActivity,
};

