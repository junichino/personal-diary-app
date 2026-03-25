import { create } from 'zustand';
import { apiGet, apiPatch } from '@/lib/api-client';
import type { AppSettings } from '@/types';

interface AppState {
  appName: string;
  loadSettings: () => Promise<AppSettings | null>;
  updateDarkMode: (darkMode: boolean) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  appName: 'My Diary',
  loadSettings: async () => {
    try {
      const settings = await apiGet<AppSettings>('/api/v1/settings');
      set({ appName: settings.appName });
      return settings;
    } catch {
      return null;
    }
  },
  updateDarkMode: async (darkMode: boolean) => {
    try {
      await apiPatch('/api/v1/settings', { darkMode });
    } catch {
      // silently ignore if settings update fails
    }
  },
}));
