import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { School } from '@/types';

export function useSchool() {
  const { profile } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.school_id) {
      setSchool(null);
      setLoading(false);
      return;
    }
    let active = true;
    supabase
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setSchool(data as School | null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profile?.school_id]);

  return { school, loading };
}
