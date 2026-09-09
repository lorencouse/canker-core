import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { supabase } from './supabase';

export interface AuthState {
  /** undefined while the initial session is being read from storage. */
  session: Session | null | undefined;
  user: User | null;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      async signOut() {
        await supabase.auth.signOut();
      }
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Throws if used on a route that is not behind the auth guard. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useUser called without a signed-in user');
  return user;
}
