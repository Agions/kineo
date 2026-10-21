import { createContext, useContext, ReactNode } from 'react';

import { useSettingsStore } from '@/stores';
import type { AppSettings } from '@/common/types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

// 创建Context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider组件 — 主题 DOM 操作已统一由 ThemeContext 处理
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// 使用Context的Hook
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings必须在SettingsProvider内部使用');
  }
  return context;
};

export default SettingsContext;
