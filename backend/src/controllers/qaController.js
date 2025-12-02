const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const qaAgencyService = require('../services/qaAgencyService');

const scheduleInspectionSchema = z.object({
  scheduledAt: z.string().datetime(),
  type: z.enum(['PHYSICAL', 'VIRTUAL']).default('PHYSICAL'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const getPendingInspections = asyncHandler(async (req, res) => {
  const inspections = await qaAgencyService.getPendingInspections(req.user.id);
  return res.json({ success: true, data: { inspections } });
});

const scheduleInspection = asyncHandler(async (req, res) => {
  const payload = scheduleInspectionSchema.parse(req.body);
  const batch = await qaAgencyService.scheduleInspection(
    req.params.batchId,
    req.user.id,
    payload
  );
  return res.json({ success: true, data: { batch } });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await qaAgencyService.getQAAgencyByUserId(req.user.id);
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: { code: 'QA_PROFILE_NOT_FOUND', message: 'QA agency profile not found' },
    });
  }
  return res.json({ success: true, data: { profile } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const updateSchema = z.object({
    certificationNumber: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  });
  
  const payload = updateSchema.parse(req.body);
  const profile = await qaAgencyService.createOrUpdateQAAgency(req.user.id, payload);
  return res.json({ success: true, data: { profile } });
});

module.exports = {
  getPendingInspections,
  scheduleInspection,
  getProfile,
  updateProfile,
};

