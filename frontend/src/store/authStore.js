import { create } from 'zustand';

const LOCAL_KEY = 'agriq_auth';

const persisted = (() => {
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
})();

const initialState = {
  user: persisted?.user || null,
  accessToken: persisted?.accessToken || null,
  refreshToken: persisted?.refreshToken || null,
};

const store = create((set) => ({
  ...initialState,
  setAuth: ({ user, accessToken, refreshToken }) =>
    set(() => {
      const next = { user, accessToken, refreshToken };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      return next;
    }),
  logout: () =>
    set(() => {
      localStorage.removeItem(LOCAL_KEY);
      return { user: null, accessToken: null, refreshToken: null };
    }),
}));

export const useAuthStore = store;

export const getAuthState = () => store.getState();

export const setAuthState = (payload) => store.getState().setAuth(payload);

export const logout = () => store.getState().logout();

