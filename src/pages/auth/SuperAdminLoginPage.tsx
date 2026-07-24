import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { roleHomePath } from '@/context/AuthContext';

export function SuperAdminLoginPage() {
  const { signIn, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast(error, 'error');
      return;
    }
    if (profile && profile.role !== 'super_admin') {
      toast('This portal is for platform administrators only.', 'error');
      return;
    }
    toast('Welcome, Administrator.', 'success');
    navigate(profile ? roleHomePath(profile.role) : '/super-admin', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to main login
        </Link>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 ring-1 ring-slate-700 mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <Logo size="md" dark />
          <h1 className="mt-5 text-lg font-semibold text-slate-100">Platform Administration</h1>
          <p className="text-sm text-slate-400 mt-1">Restricted access. Authorized personnel only.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-slate-900/80 ring-1 ring-slate-800 p-6">
          <Input
            label="Administrator email"
            name="email"
            type="email"
            required
            placeholder="admin@edubridge.io"
            leftIcon={<Lock className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
          />
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
          />
          <Button type="submit" loading={loading} className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Authenticate
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          This is a private endpoint. Unauthorized access is prohibited and logged.
        </p>
      </div>
    </div>
  );
}
