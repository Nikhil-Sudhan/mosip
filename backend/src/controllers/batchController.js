const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const batchService = require('../services/batchService');

const batchSchema = z.object({
  productType: z.string().min(1),
  variety: z.string().optional(),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  originCountry: z.string().min(1),
  destinationCountry: z.string().min(1),
  harvestDate: z.string().min(4),
  notes: z.string().optional(),
});

const inspectionSchema = z.object({
  moisturePercent: z.coerce.number().nonnegative().max(100),
  pesticidePPM: z.coerce.number().nonnegative().max(10),
  organicStatus: z.string().min(2),
  isoCode: z.string().min(2),
  result: z.enum(['PASS', 'FAIL']),
  notes: z.string().optional(),
});

const list = asyncHandler(async (req, res) => {
  const batches = await batchService.listBatchesForUser(req.user);
  res.json({ success: true, data: { batches } });
});

const show = asyncHandler(async (req, res) => {
  const batch = await batchService.getBatchById(req.user, req.params.id);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' },
    });
  }
  return res.json({ success: true, data: { batch } });
});

const create = asyncHandler(async (req, res) => {
  const payload = batchSchema.parse(req.body);
  const batch = await batchService.createBatch(req.user, payload, req.files);
  res.status(201).json({ success: true, data: { batch } });
});

const addDocuments = asyncHandler(async (req, res) => {
  const batch = await batchService.appendDocuments(
    req.user,
    req.params.id,
    req.files
  );
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' },
    });
  }
  return res.json({ success: true, data: { batch } });
});

const recordInspection = asyncHandler(async (req, res) => {
  const payload = inspectionSchema.parse(req.body);
  const batch = await batchService.recordInspection(
    req.user,
    req.params.id,
    payload
  );
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found or inaccessible' },
    });
  }
  return res.json({ success: true, data: { batch } });
});

module.exports = {
  list,
  show,
  create,
  addDocuments,
  recordInspection,
};

