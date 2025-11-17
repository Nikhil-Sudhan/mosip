const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const credentialService = require('../services/credentialService');
const templateService = require('../services/templateService');

const issue = asyncHandler(async (req, res) => {
  const credential = await credentialService.issueCredential(
    req.user,
    req.params.batchId
  );
  if (!credential) {
    return res.status(404).json({
      success: false,
      error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found or inaccessible' },
    });
  }
  return res
    .status(201)
    .json({ success: true, data: { credential } });
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

const templateSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(5),
  schemaUrl: z.string().url(),
  fields: z.array(z.string().min(1)).min(1),
});

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.listTemplates();
  return res.json({ success: true, data: { templates } });
});

const createTemplate = asyncHandler(async (req, res) => {
  const payload = templateSchema.parse(req.body);
  const template = await templateService.createTemplate(req.user, payload);
  return res.status(201).json({ success: true, data: { template } });
});

module.exports = {
  issue,
  show,
  revoke,
  listTemplates,
  createTemplate,
};


