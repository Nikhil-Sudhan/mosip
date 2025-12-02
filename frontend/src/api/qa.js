import api from './client';

export async function fetchPendingInspections() {
  const response = await api.get('/qa/pending-inspections');
  return response.data.data.inspections;
}

export async function scheduleInspection(batchId, payload) {
  const response = await api.post(`/qa/schedule-inspection/${batchId}`, payload);
  return response.data.data.batch;
}

export async function getQAProfile() {
  const response = await api.get('/qa/profile');
  return response.data.data.profile;
}

export async function updateQAProfile(payload) {
  const response = await api.put('/qa/profile', payload);
  return response.data.data.profile;
}

