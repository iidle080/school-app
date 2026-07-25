import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { roleHomePath } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { DemoCredentials } from '@/lib/demo';
import { DEMO_PASSWORD } from '@/lib/constants';

export function useDemoAuth() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const openDashboard = useCallback(
    async (creds: DemoCredentials) => {
      setSwitching(true);
      try {
        await signOut();
        const { error } = await supabase.auth.signInWithPassword({
          email: creds.email,
          password: DEMO_PASSWORD,
        });
        if (error) {
          toast(error.message, 'error');
          setSwitching(false);
          return;
        }
        toast(`Signed in as ${creds.fullName}.`, 'success');
        navigate(roleHomePath(creds.role), { replace: true });
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Failed to switch accounts.', 'error');
        setSwitching(false);
      }
    },
    [signOut, toast, navigate],
  );

  return { openDashboard, switching };
}
