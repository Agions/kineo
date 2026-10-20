import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AppSettings } from '@/common/types';

interface SettingsState {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = { autoSave: true, theme: 'light', aiModelsSettings: {} };

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'kineo-settings' }
  )
);
