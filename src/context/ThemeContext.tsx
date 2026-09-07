import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { themeService } from '@/services/themeService';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = themeService.getTheme();
    setThemeState(saved);
    const dark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    themeService.applyTheme(saved);

    (async () => {
      const dbTheme = await themeService.loadThemeFromDb();
      if (dbTheme && dbTheme !== saved) {
        setThemeState(dbTheme);
        const dbDark = dbTheme === 'dark' || (dbTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDark(dbDark);
        themeService.applyTheme(dbTheme);
        localStorage.setItem('stemerflow:theme', dbTheme);
      }
    })();
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setIsDark(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    themeService.setTheme(t);
  };

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    return next;
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
