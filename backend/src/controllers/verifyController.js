const asyncHandler = require('../utils/asyncHandler');
const verificationService = require('../services/verificationService');

const verifyById = asyncHandler(async (req, res) => {
  // Get access token for INJI verification if available
  const accessToken = req.headers['x-esignet-token'] || req.user?.esignetAccessToken || null;
  
  const result = await verificationService.verifyCredentialById(
    req.params.credentialId,
    req.user || null,
    accessToken
  );
  return res.json({ success: true, data: result });
});

const verifyByUpload = asyncHandler(async (req, res) => {
  // Get access token for INJI verification if available
  const accessToken = req.headers['x-esignet-token'] || req.user?.esignetAccessToken || null;
  
  const result = await verificationService.verifyCredentialUpload(
    req.body?.credential || req.body,
    req.user || null,
    accessToken
  );
  return res.json({ success: true, data: result });
});

const activity = asyncHandler(async (req, res) => {
  const entries = await verificationService.listActivity();
  return res.json({ success: true, data: { entries } });
});

module.exports = {
  verifyById,
  verifyByUpload,
  activity,
};




