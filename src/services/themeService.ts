import { supabase } from './supabaseClient';

const THEME_KEY = 'stemerflow:theme';

export const themeService = {
  getTheme(): 'dark' | 'light' | 'system' {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'system') return stored;
    return 'dark';
  },

  async loadThemeFromDb(): Promise<'dark' | 'light' | 'system' | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data } = await supabase
      .from('user_settings')
      .select('theme')
      .maybeSingle();

    if (data?.theme && ['dark', 'light', 'system'].includes(data.theme)) {
      return data.theme as 'dark' | 'light' | 'system';
    }
    return null;
  },

  setTheme(theme: 'dark' | 'light' | 'system') {
    localStorage.setItem(THEME_KEY, theme);
    this.applyTheme(theme);
    this.syncThemeToDb(theme);
  },

  async syncThemeToDb(theme: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: existing } = await supabase
      .from('user_settings')
      .select('user_id')
      .maybeSingle();

    if (existing) {
      await supabase.from('user_settings').update({ theme, updated_at: new Date().toISOString() }).eq('user_id', session.user.id);
    } else {
      await supabase.from('user_settings').insert({ user_id: session.user.id, theme });
    }
  },

  applyTheme(theme: 'dark' | 'light' | 'system') {
    const root = document.documentElement;
    let isDark: boolean;

    if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },

  toggle() {
    const current = this.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  },
};
