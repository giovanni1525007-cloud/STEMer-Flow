import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Grade, Language } from '@/types';
import { authService } from '@/services/authService';
import { supabase } from '@/services/supabaseClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (params: { fullName: string; phone: string; password: string; grade: Grade; language: Language }) => Promise<{ error: string | null }>;
  signIn: (phone: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const current = await authService.getCurrentUser();
      setUser(current);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session?.user) {
          setUser(null);
          return;
        }
        const profile = await authService.fetchProfile(session.user.id);
        if (profile) setUser(profile);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (params: { fullName: string; phone: string; password: string; grade: Grade; language: Language }) => {
    const { user: newUser, error } = await authService.signUp(params);
    if (newUser) setUser(newUser);
    return { error };
  };

  const signIn = async (phone: string, password: string) => {
    const { user: existingUser, error } = await authService.signIn(phone, password);
    if (existingUser) setUser(existingUser);
    return { error };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = await authService.updateUser(user.id, updates);
    if (updated) setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
