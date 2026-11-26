export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'voya_theme_mode';

export function resolveInitialTheme(storedValue?: string | null): ThemeMode {
  if (storedValue === 'light') {
    return 'light';
  }
  return 'dark';
}

export function getNextTheme(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

export function getThemeToggleMeta(current: ThemeMode): {
  nextTheme: ThemeMode;
  ariaLabel: string;
  shortLabel: string;
} {
  if (current === 'dark') {
    return {
      nextTheme: 'light',
      ariaLabel: 'Switch to light mode',
      shortLabel: 'Light',
    };
  }
  return {
    nextTheme: 'dark',
    ariaLabel: 'Switch to dark mode',
    shortLabel: 'Dark',
  };
}
