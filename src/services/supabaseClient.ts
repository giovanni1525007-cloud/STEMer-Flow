import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) return true;
  if (error instanceof Error && /network|fetch|ECONNREFUSED|ENOTFOUND|ERR_NETWORK/i.test(error.message)) return true;
  return false;
}

export function friendlyError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}
