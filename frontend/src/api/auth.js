import api from './client';
import {
  setAuthState,
  logout as clearAuth,
  getAuthState,
} from '../store/authStore';

export async function login(credentials) {
  const response = await api.post('/auth/login', credentials);
  const { user, accessToken, refreshToken } = response.data.data;
  setAuthState({ user, accessToken, refreshToken });
  return user;
}

export async function logout() {
  const state = getAuthState();
  if (state?.refreshToken) {
    await api.post('/auth/logout', { refreshToken: state.refreshToken });
  } else {
    await api.post('/auth/logout');
  }
  clearAuth();
}

