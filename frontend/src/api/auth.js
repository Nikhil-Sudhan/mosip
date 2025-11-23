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

export async function register(userData) {
  try {
    const response = await api.post('/auth/create-account', userData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { user, accessToken, refreshToken } = response.data.data;
    setAuthState({ user, accessToken, refreshToken });
    return user;
  } catch (error) {
    console.error('Registration API error:', error);
    throw error;
  }
}

export async function logout() {
  try {
    const state = getAuthState();
    if (state?.refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken: state.refreshToken });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuth();
  }
}

