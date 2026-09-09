import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { env } from './env';
import { DEMO_USER_EMAIL, DEMO_USER_ID } from './demo/dataset';
import { supabase } from './supabase';

export interface AuthState {
  /** undefined while the initial session is being read from storage. */
  session: Session | null | undefined;
  user: User | null;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Demo mode never talks to Supabase, so it hands out a fixed local session. */
const DEMO_USER: User = {
  id: DEMO_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: DEMO_USER_EMAIL,
  app_metadata: { provider: 'demo', providers: ['demo'] },
  user_metadata: { full_name: 'Demo User' },
  created_at: new Date(0).toISOString()
};

const DEMO_SESSION: Session = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  token_type: 'bearer',
  expires_in: 60 * 60 * 24 * 365,
  user: DEMO_USER
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(
    env.demo ? DEMO_SESSION : undefined
  );

  useEffect(() => {
    if (env.demo) return;
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
        if (env.demo) {
          // There is nobody to sign out of. Start the demo over instead.
          window.location.assign('/today');
          return;
        }
        await supabase.auth.signOut();
        // Do not wait for the SIGNED_OUT broadcast: dropping the session here
        // makes the route guard redirect deterministically on the next render.
        setSession(null);
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
