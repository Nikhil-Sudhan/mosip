const path = require('path');
const { v4: uuid } = require('uuid');
const { ensureJSON, readJSON, writeJSON } = require('../lib/fileStore');
const auditService = require('./auditService');

const BATCHES_FILE = path.join(__dirname, '..', 'data', 'batches.json');

async function initStore() {
  await ensureJSON(BATCHES_FILE, []);
}

async function getAllBatches() {
  await initStore();
  return readJSON(BATCHES_FILE);
}

async function saveBatches(batches) {
  await writeJSON(BATCHES_FILE, batches);
}

function filterByRole(user, batches) {
  if (user.role === 'ADMIN' || user.role === 'QA') {
    return batches;
  }
  return batches.filter((batch) => batch.exporterId === user.id);
}

async function listBatchesForUser(user) {
  const batches = await getAllBatches();
  return filterByRole(user, batches);
}

function canViewBatch(user, batch) {
  if (!batch) return false;
  return (
    user.role === 'ADMIN' ||
    user.role === 'QA' ||
    batch.exporterId === user.id
  );
}

async function getBatchById(user, batchId) {
  const batches = await getAllBatches();
  const batch = batches.find((item) => item.id === batchId);
  if (!canViewBatch(user, batch)) {
    return null;
  }
  return batch;
}

function mapDocuments(files = []) {
  const now = new Date().toISOString();
  return files.map((file) => ({
    id: uuid(),
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.filename,
    url: `/uploads/${file.filename}`,
    uploadedAt: now,
  }));
}

async function createBatch(user, payload, files) {
  const batches = await getAllBatches();
  const now = new Date().toISOString();
  const documents = mapDocuments(files);

  const batch = {
    id: uuid(),
    exporterId: user.id,
    productType: payload.productType,
    variety: payload.variety || '',
    quantity: payload.quantity,
    unit: payload.unit,
    originCountry: payload.originCountry,
    destinationCountry: payload.destinationCountry,
    harvestDate: payload.harvestDate,
    notes: payload.notes || '',
    status: 'SUBMITTED',
    docs: documents,
    inspection: null,
    history: [
      {
        id: uuid(),
        status: 'SUBMITTED',
        message: 'Batch submitted by exporter',
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  batches.push(batch);
  await saveBatches(batches);
  await auditService.logAction('batch.submitted', {
    userId: user.id,
    role: user.role,
    entityType: 'BATCH',
    entityId: batch.id,
    metadata: { productType: batch.productType },
  });
  return batch;
}

async function appendDocuments(user, batchId, files) {
  const batches = await getAllBatches();
  const index = batches.findIndex((batch) => batch.id === batchId);
  if (index === -1) {
    return null;
  }
  const batch = batches[index];
  if (batch.exporterId !== user.id && user.role !== 'ADMIN') {
    return null;
  }

  const docs = mapDocuments(files);
  batch.docs = [...batch.docs, ...docs];
  batch.updatedAt = new Date().toISOString();
  batch.history = Array.isArray(batch.history) ? batch.history : [];
  batch.history.push({
    id: uuid(),
    status: batch.status,
    message: 'New supporting documents uploaded',
    createdAt: batch.updatedAt,
  });
  batches[index] = batch;
  await saveBatches(batches);
  return batch;
}

async function recordInspection(user, batchId, payload) {
  const batches = await getAllBatches();
  const index = batches.findIndex((batch) => batch.id === batchId);
  if (index === -1) {
    return null;
  }
  const batch = batches[index];
  if (user.role !== 'QA' && user.role !== 'ADMIN') {
    return null;
  }
  const now = new Date().toISOString();
  batch.inspection = {
    moisturePercent: payload.moisturePercent,
    pesticidePPM: payload.pesticidePPM,
    organicStatus: payload.organicStatus,
    isoCode: payload.isoCode,
    result: payload.result,
    notes: payload.notes || '',
    inspectorId: user.id,
    inspectorOrg: user.organization || user.email,
    recordedAt: now,
  };
  batch.status = payload.result === 'PASS' ? 'INSPECTED' : 'REJECTED';
  batch.history = Array.isArray(batch.history) ? batch.history : [];
  batch.history.push({
    id: uuid(),
    status: batch.status,
    message: `Inspection recorded (${payload.result})`,
    createdAt: now,
  });
  batch.updatedAt = now;
  batches[index] = batch;
  await saveBatches(batches);
  await auditService.logAction('inspection.recorded', {
    userId: user.id,
    role: user.role,
    entityType: 'BATCH',
    entityId: batchId,
    metadata: { result: payload.result },
  });
  return batch;
}

async function markBatchCertified(batchId, actor = {}) {
  const batches = await getAllBatches();
  const index = batches.findIndex((batch) => batch.id === batchId);
  if (index === -1) {
    return null;
  }

  const batch = batches[index];
  const now = new Date().toISOString();

  batch.status = 'CERTIFIED';
  batch.history = Array.isArray(batch.history) ? batch.history : [];
  batch.history.push({
    id: uuid(),
    status: 'CERTIFIED',
    message: `Credential issued by ${actor.organization || 'QA Team'}`,
    createdAt: now,
  });
  batch.updatedAt = now;

  batches[index] = batch;
  await saveBatches(batches);
  return batch;
}

module.exports = {
  listBatchesForUser,
  getBatchById,
  createBatch,
  appendDocuments,
  recordInspection,
  markBatchCertified,
};

