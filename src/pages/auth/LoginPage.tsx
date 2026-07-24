import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { roleHomePath } from '@/context/AuthContext';

export function LoginPage() {
  const { signIn, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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
    toast('Welcome back!', 'success');
    if (redirect) {
      navigate(redirect, { replace: true });
    } else if (profile) {
      navigate(roleHomePath(profile.role), { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthLayout>
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-ink dark:text-slate-100">Sign in to your account</h2>
        <p className="text-ink-muted mt-1.5 text-sm">
          For school administrators, teachers, and parents.
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@school.com"
            leftIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-ink-muted hover:text-ink transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full btn-lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Sign in
          </Button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
          <p className="text-sm text-ink-muted">
            Don't have an account?
          </p>
          <p className="text-sm text-ink-soft dark:text-slate-300 mt-1">
            Account access is invitation-only. Your school administrator will send you a secure invite link to join.
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs text-ink-muted">Platform staff</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>
        <Link
          to="/owner/login"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm font-medium text-ink-soft dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <ShieldCheck className="h-4 w-4 text-primary-600" />
          Owner / Super Admin Login
        </Link>
      </div>
    </AuthLayout>
  );
}
