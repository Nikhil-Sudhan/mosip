import api from './client';

export async function fetchBatches() {
  const response = await api.get('/batches');
  return response.data.data.batches;
}

export async function fetchBatch(id) {
  const response = await api.get(`/batches/${id}`);
  return response.data.data.batch;
}

export async function createBatch(formData) {
  const response = await api.post('/batches', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.batch;
}

export async function uploadBatchDocuments(id, formData) {
  const response = await api.post(`/batches/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.batch;
}

export async function recordInspection(batchId, payload) {
  const response = await api.post(`/batches/${batchId}/inspection`, payload);
  return response.data.data.batch;
}

