import { useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_KEY = 'qiahao-theme-preference';

export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function applyThemePreference(preference: ThemePreference): void {
  if (preference === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = preference;
}

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());

  useEffect(() => {
    applyThemePreference(preference);
    try {
      if (preference === 'system') window.localStorage.removeItem(THEME_KEY);
      else window.localStorage.setItem(THEME_KEY, preference);
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
  }, [preference]);

  return { preference, setPreference: setPreferenceState };
}

export function nextThemePreference(preference: ThemePreference): ThemePreference {
  if (preference === 'system') return 'light';
  if (preference === 'light') return 'dark';
  return 'system';
}

export const themeLabels: Record<ThemePreference, string> = {
  system: '跟随系统',
  light: '浅色',
  dark: '深色',
};
