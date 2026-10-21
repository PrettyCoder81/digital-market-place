import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'darkMode';

function readInitialPreference(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  } catch {
    return true;
  }
}

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState<boolean>(readInitialPreference);

  // Keep <html data-theme="..."> in sync with state (and apply the persisted
  // preference on first mount).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { darkMode, toggleDarkMode };
}
