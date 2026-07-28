import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppUser, School } from '@/types';

interface AuthContextValue {
  profile: AppUser | null;
  school: School | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { if (mounted) setLoading(false); return; }
      loadProfile(session.user.id, mounted);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setProfile(null); setSchool(null); setLoading(false); return; }
      loadProfile(session.user.id, mounted);
    });

    return () => { mounted = false; subscription.unsubscribe(); };

    async function loadProfile(uid: string, m: boolean) {
      const { data: p } = await supabase.from('app_users').select('*').eq('user_id', uid).maybeSingle();
      if (!m) return;
      setProfile(p as AppUser | null);
      if (p?.school_id) {
        const { data: s } = await supabase.from('schools').select('*').eq('id', p.school_id).maybeSingle();
        if (m) setSchool(s as School | null);
      }
      if (m) setLoading(false);
    }
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ profile, school, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
