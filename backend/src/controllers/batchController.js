const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const batchService = require('../services/batchService');

const batchSchema = z.object({
  // Product Batch Documents
  productType: z.string().min(1),
  grade: z.string().optional(),
  variety: z.string().optional(),
  batchNumber: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  weight: z.coerce.number().positive().optional(),
  weightUnit: z.string().optional(),
  
  // Harvest/Farm Details
  farmAddress: z.string().optional(),
  farmerDetails: z.string().optional(),
  harvestDate: z.string().min(4),
  organicStatus: z.enum(['ORGANIC', 'NON_ORGANIC']).optional(),
  
  // Packaging Details
  containerDetails: z.string().optional(),
  
  // Origin/Destination
  originCountry: z.string().min(1),
  destinationCountry: z.string().min(1),
  
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
  
  // Flatten files from fields structure and maintain category mapping
  const allFiles = [];
  const fileCategories = [];
  
  if (req.files) {
    // Handle categorized uploads
    ['productDocuments', 'labReports', 'certifications', 'complianceDocs', 'packagingPhotos'].forEach(category => {
      if (req.files[category]) {
        req.files[category].forEach(file => {
          allFiles.push(file);
          fileCategories.push(category);
        });
      }
    });
    
    // Handle general documents (backward compatibility)
    if (req.files['documents']) {
      req.files['documents'].forEach(file => {
        allFiles.push(file);
        fileCategories.push('general');
      });
    }
  }
  
  const batch = await batchService.createBatch(req.user, payload, allFiles, fileCategories);
  res.status(201).json({ success: true, data: { batch } });
});

const addDocuments = asyncHandler(async (req, res) => {
  // Flatten files from fields structure and maintain category mapping
  const allFiles = [];
  const fileCategories = [];
  
  if (req.files) {
    // Handle categorized uploads
    ['productDocuments', 'labReports', 'certifications', 'complianceDocs', 'packagingPhotos'].forEach(category => {
      if (req.files[category]) {
        req.files[category].forEach(file => {
          allFiles.push(file);
          fileCategories.push(category);
        });
      }
    });
    
    // Handle general documents (backward compatibility)
    if (req.files['documents']) {
      req.files['documents'].forEach(file => {
        allFiles.push(file);
        fileCategories.push('general');
      });
    }
  }
  
  const batch = await batchService.appendDocuments(
    req.user,
    req.params.id,
    allFiles,
    fileCategories
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

