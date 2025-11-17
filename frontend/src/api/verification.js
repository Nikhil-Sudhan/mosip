import api from './client';

export async function verifyById(credentialId) {
  const response = await api.get(`/verify/${credentialId}`);
  return response.data.data;
}

export async function verifyByUpload(credentialJson) {
  const response = await api.post('/verify/upload', {
    credential: credentialJson,
  });
  return response.data.data;
}

export async function fetchVerificationActivity() {
  const response = await api.get('/verify/activity');
  return response.data.data.entries;
}

