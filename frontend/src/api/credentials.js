import api from './client';

export async function issueCredential(batchId) {
  const response = await api.post(`/vc/${batchId}/issue`);
  return response.data.data.credential;
}

export async function fetchCredential(batchId) {
  const response = await api.get(`/vc/${batchId}`);
  return response.data.data.credential;
}

export async function revokeCredential(batchId, reason) {
  const response = await api.post(`/vc/${batchId}/revoke`, { reason });
  return response.data.data.credential;
}



