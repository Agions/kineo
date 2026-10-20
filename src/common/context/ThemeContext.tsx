/**
 * Theme Context — 浅色(默认)/暗黑/跟随系统 三模无缝全局引擎
 * 沉降至 shared/context 供全局合法消费
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

import { useSettingsStore } from '@/common/stores/settings-store';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme();
  return theme || 'dark';
}

function applyThemeToDOM(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'dark-theme', 'light-theme');

  if (resolved === 'dark') {
    root.classList.add('dark', 'dark-theme');
    root.setAttribute('data-theme', 'dark');
    document.body.style.backgroundColor = '#09090b';
    document.body.style.color = '#f4f4f5';
  } else {
    root.classList.add('light', 'light-theme');
    root.setAttribute('data-theme', 'light');
    document.body.style.backgroundColor = '#fafafa';
    document.body.style.color = '#09090b';
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storeTheme = useSettingsStore((s) => (s?.settings?.theme as ThemeMode) || 'dark');
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [activeTheme, setActiveThemeState] = useState<ThemeMode>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('kineo-theme') as ThemeMode;
      if (saved) return saved;
    }
    return storeTheme;
  });

  useEffect(() => {
    const resolved = resolveTheme(activeTheme);
    applyThemeToDOM(resolved);

    if (activeTheme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDOM(getSystemTheme());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [activeTheme]);

  const setTheme = (t: ThemeMode) => {
    setActiveThemeState(t);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kineo-theme', t);
    }
    updateSettings?.({ theme: t });
    applyThemeToDOM(resolveTheme(t));
  };

  const toggleTheme = () => {
    const currentResolved = resolveTheme(activeTheme);
    const nextTheme: ThemeMode = currentResolved === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const resolvedTheme = resolveTheme(activeTheme);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        setTheme,
        toggleTheme,
        resolvedTheme,
        isDarkMode: resolvedTheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};

export default ThemeProvider;
