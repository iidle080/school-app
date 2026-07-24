import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export function ResetPasswordPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      toast('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Password updated successfully.', 'success');
    navigate('/login', { replace: true });
  };

  return (
    <AuthLayout>
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-ink dark:text-slate-100">Set a new password</h2>
        <p className="text-ink-muted mt-1.5 text-sm">Choose a strong password for your account.</p>
        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <Input
            label="New password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password"
            name="confirm"
            type="password"
            required
            placeholder="••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" loading={loading} className="w-full btn-lg">
            Update password
          </Button>
        </form>
        <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
