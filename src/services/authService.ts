import { supabase } from './supabaseClient';
import type { User, Grade, Language } from '@/types';

export interface SignUpParams {
  fullName: string;
  phone: string;
  password: string;
  grade: Grade;
  language: Language;
}

function phoneToEmail(phone: string): string {
  const cleaned = phone.replace(/[^+\d]/g, '');
  return `${cleaned}@stemerflow.app`;
}

function mapProfileRow(row: any): User {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    password: '',
    grade: row.grade,
    language: row.language,
    createdAt: row.created_at,
    onboarded: row.onboarded,
  };
}

export const authService = {
  async signUp({ fullName, phone, password, grade, language }: SignUpParams): Promise<{ user: User | null; error: string | null }> {
    const email = phoneToEmail(phone);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, grade, language },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { user: null, error: 'An account with this phone number already exists.' };
      }
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Sign up failed. Please try again.' };
    }

    const profile: User = {
      id: data.user.id,
      fullName,
      phone,
      password: '',
      grade,
      language,
      createdAt: new Date().toISOString(),
      onboarded: false,
    };

    return { user: profile, error: null };
  },

  async signIn(phone: string, password: string): Promise<{ user: User | null; error: string | null }> {
    const email = phoneToEmail(phone);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { user: null, error: 'No account found with this phone number or incorrect password.' };
      }
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Sign in failed. Please try again.' };
    }

    const profile = await this.fetchProfile(data.user.id);
    return { user: profile, error: null };
  },

  async fetchProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return mapProfileRow(data);
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return this.fetchProfile(session.user.id);
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const dbUpdates: Record<string, any> = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.onboarded !== undefined) dbUpdates.onboarded = updates.onboarded;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (error || !data) return null;
    return mapProfileRow(data);
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },
};
