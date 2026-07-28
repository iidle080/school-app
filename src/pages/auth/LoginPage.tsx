import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { GraduationCap } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast(error.message, 'error');
      return;
    }
    // Don't navigate manually — AuthContext onAuthStateChange will set profile
    // and RoleRedirect will route automatically. Just wait briefly.
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 300);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: '#0d1117' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#3b82f6' }}>
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#e6edf3' }}>EduBridge</h1>
          <p className="text-sm mt-1" style={{ color: '#5c7a9a' }}>School Management System</p>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#e6edf3' }}>Sign In</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="input-label">Email</label>
              <input className="input" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input className="input" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
