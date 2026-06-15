/**
 * SGIP — Theme Toggle Hook
 * Ticket: SGIP-1.2.2.2
 *
 * Provides theme switching between dark (default) and light.
 * Writes preference to localStorage for persistence across page loads.
 * Updates [data-theme] on <html> — CSS custom properties react immediately.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Initialize from DOM (set by the inline script in layout.tsx)
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as Theme;
    if (current === 'light' || current === 'dark') {
      // Defer state update to avoid synchronous cascading render warning
      Promise.resolve().then(() => {
        setThemeState(current);
      });
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('sgip-theme', newTheme);
    } catch {
      // localStorage unavailable — still apply to DOM
    }
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}
