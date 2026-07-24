import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setSent(true);
    toast('Reset link sent to your email.', 'success');
  };

  return (
    <AuthLayout>
      <div className="animate-fade-in">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-bg text-success-dark mb-4">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-ink dark:text-slate-100">Check your email</h2>
            <p className="text-ink-muted mt-2 text-sm">
              We've sent a password reset link to <span className="font-medium text-ink">{email}</span>.
              The link will expire shortly.
            </p>
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-ink dark:text-slate-100">Forgot your password?</h2>
            <p className="text-ink-muted mt-1.5 text-sm">
              No worries — enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <Input
                label="Email address"
                name="email"
                type="email"
                required
                placeholder="you@school.com"
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" loading={loading} className="w-full btn-lg">
                Send reset link
              </Button>
            </form>
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
