import api from './client';

export async function createUser(payload) {
  const response = await api.post('/users', payload);
  return response.data.data.user;
}




