const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const credentialService = require('../services/credentialService');

const issue = asyncHandler(async (req, res) => {
  try {
    // Get eSignet access token from request headers or user session
    const esignetAccessToken = req.headers['x-esignet-token'] || req.user?.esignetAccessToken || null;
    
    const credential = await credentialService.issueCredential(
      req.user,
      req.params.batchId,
      esignetAccessToken
    );
    return res
      .status(201)
      .json({ success: true, data: { credential } });
  } catch (error) {
    const errorMessages = {
      'BATCH_NOT_FOUND': { code: 'BATCH_NOT_FOUND', message: 'Batch not found or inaccessible', status: 404 },
      'BATCH_REJECTED': { code: 'BATCH_REJECTED', message: 'Cannot issue credential for a rejected batch', status: 400 },
      'BATCH_NOT_INSPECTED': { code: 'BATCH_NOT_INSPECTED', message: 'Batch must be inspected and pass QA before credential can be issued', status: 400 },
      'INSPECTION_NOT_PASSED': { code: 'INSPECTION_NOT_PASSED', message: 'Batch inspection must pass before credential can be issued', status: 400 },
      'CREDENTIAL_ALREADY_ISSUED': { code: 'CREDENTIAL_ALREADY_ISSUED', message: 'Credential has already been issued for this batch', status: 400 },
    };

    const errorInfo = errorMessages[error.message] || {
      code: 'CREDENTIAL_ISSUE_ERROR',
      message: error.message || 'Failed to issue credential',
      status: 500,
    };

    return res.status(errorInfo.status).json({
      success: false,
      error: { code: errorInfo.code, message: errorInfo.message },
    });
  }
});

const show = asyncHandler(async (req, res) => {
  const credential = await credentialService.getCredentialForBatch(
    req.user,
    req.params.batchId
  );
  if (!credential) {
    return res.status(404).json({
      success: false,
      error: { code: 'CREDENTIAL_NOT_FOUND', message: 'Credential not issued yet' },
    });
  }
  return res.json({ success: true, data: { credential } });
});

const revokeSchema = z.object({
  reason: z.string().min(3).optional(),
});

const revoke = asyncHandler(async (req, res) => {
  const payload = revokeSchema.parse(req.body || {});
  const credential = await credentialService.revokeCredential(
    req.user,
    req.params.batchId,
    payload.reason
  );
  if (!credential) {
    return res.status(404).json({
      success: false,
      error: { code: 'CREDENTIAL_NOT_FOUND', message: 'Credential not found' },
    });
  }
  return res.json({ success: true, data: { credential } });
});

module.exports = {
  issue,
  show,
  revoke,
};


