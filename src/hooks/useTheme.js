import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'app_theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Sync with other instances via custom event
  useEffect(() => {
    const handler = (e) => setTheme(e.detail);
    window.addEventListener('theme-change', handler);
    return () => window.removeEventListener('theme-change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
      });
      return next;
    });
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
