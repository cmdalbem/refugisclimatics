import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const listeners = new Set<() => void>();

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemTheme();
}

export function getCurrentTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme | undefined) ?? getStoredTheme();
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (localStorage.getItem(STORAGE_KEY)) return;
  applyTheme(event.matches ? 'dark' : 'light');
});

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getCurrentTheme, getCurrentTheme);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
