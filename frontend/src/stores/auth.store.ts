import { create } from 'zustand';
import { apiGet, apiPost } from '@/lib/api-client';
import type { AuthStatus } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isSetup: boolean;
  isLoading: boolean;
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isSetup: false,
  isLoading: true,
  checkStatus: async () => {
    try {
      set({ isLoading: true });
      const status = await apiGet<AuthStatus>('/api/v1/auth/status');
      set({
        isAuthenticated: status.isAuthenticated,
        isSetup: status.isSetup,
        isLoading: false,
      });
    } catch {
      set({ isAuthenticated: false, isSetup: false, isLoading: false });
    }
  },
  logout: async () => {
    try {
      await apiPost('/api/v1/auth/logout', {});
    } finally {
      set({ isAuthenticated: false });
    }
  },
  setAuthenticated: (value) => set({ isAuthenticated: value }),
}));
