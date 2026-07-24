import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { ROLE_LABELS, INVITATION_EXPIRY_DAYS } from '@/lib/constants';
import { isExpired, formatDate } from '@/lib/utils';
import type { Invitation, School } from '@/types';
import { roleHomePath } from '@/context/AuthContext';

type State = 'loading' | 'valid' | 'expired' | 'used' | 'cancelled' | 'not_found' | 'success';

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [state, setState] = useState<State>('loading');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [school, setSchool] = useState<School | null>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('not_found');
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setState('not_found');
        return;
      }
      const inv = data as Invitation;
      setInvitation(inv);
      if (inv.status === 'cancelled') {
        setState('cancelled');
        return;
      }
      if (inv.status === 'accepted') {
        setState('used');
        return;
      }
      if (isExpired(inv.expires_at)) {
        setState('expired');
        return;
      }
      if (inv.school_id) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('*')
          .eq('id', inv.school_id)
          .maybeSingle();
        if (active) setSchool(schoolData as School | null);
      }
      setState('valid');
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invitation || !invitation.email) return;
    if (password.length < 8) {
      toast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      toast('Passwords do not match.', 'error');
      return;
    }
    if (!acceptTerms) {
      toast('Please accept the Terms to continue.', 'error');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        data: { full_name: invitation.full_name ?? '', role: invitation.role },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) {
      setLoading(false);
      toast(error.message, 'error');
      return;
    }
    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      toast('Could not create your account. Please try again.', 'error');
      return;
    }

    // create profile
    const { error: profileErr } = await supabase.from('app_users').insert({
      user_id: userId,
      school_id: invitation.school_id,
      role: invitation.role,
      full_name: invitation.full_name ?? 'New User',
      phone: invitation.phone ?? null,
    });
    if (profileErr) {
      setLoading(false);
      toast(profileErr.message, 'error');
      return;
    }

    // mark invitation accepted
    await supabase
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString(), accepted_by: userId })
      .eq('id', invitation.id);

    setLoading(false);
    setState('success');
    toast('Your account has been created. Welcome to EduBridge!', 'success');
  };

  if (state === 'loading') {
    return (
      <Centered>
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-ink-muted mt-3">Verifying your invitation…</p>
      </Centered>
    );
  }

  if (state === 'success') {
    return (
      <Centered>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-bg text-success-dark mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-ink dark:text-slate-100">You're all set!</h1>
        <p className="text-ink-muted mt-2 max-w-sm text-center">
          Your EduBridge account has been created. You can now sign in with your email and password.
        </p>
        <Button className="mt-6 btn-lg" onClick={() => navigate('/login')} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Continue to sign in
        </Button>
      </Centered>
    );
  }

  if (state === 'not_found') {
    return <InvalidState icon={XCircle} title="Invitation not found" text="This invitation link is invalid or has been removed. Please contact your school administrator." />;
  }
  if (state === 'expired') {
    return <InvalidState icon={Clock} title="Invitation expired" text={`This invitation expired on ${formatDate(invitation?.expires_at)}. Please request a new invitation from your school.`} />;
  }
  if (state === 'cancelled') {
    return <InvalidState icon={XCircle} title="Invitation cancelled" text="This invitation has been cancelled by the school. Please contact your school administrator if you believe this is an error." />;
  }
  if (state === 'used') {
    return <InvalidState icon={CheckCircle2} title="Invitation already used" text="This invitation has already been accepted. You can sign in with the account you created." action />;
  }

  return (
    <Centered>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-7">
          <Logo size="md" />
          <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-light">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-ink dark:text-slate-100">Create your account</h1>
          <p className="text-ink-muted mt-2 text-sm">
            {school ? (
              <>
                <span className="font-medium text-ink">{school.name}</span> has invited you to join EduBridge as a{' '}
                <span className="font-medium text-primary-600">{invitation ? ROLE_LABELS[invitation.role] : ''}</span>.
              </>
            ) : (
              <>You've been invited to join EduBridge as a {invitation ? ROLE_LABELS[invitation.role] : ''}.</>
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card p-6">
          <div className="mb-4 rounded-xl bg-primary-50 dark:bg-primary-500/10 px-4 py-3 text-sm">
            <p className="text-ink-soft dark:text-slate-300">
              <span className="font-medium">Name:</span> {invitation?.full_name}
            </p>
            <p className="text-ink-soft dark:text-slate-300 mt-1">
              <span className="font-medium">Email:</span> {invitation?.email}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Create password"
              name="password"
              type="password"
              required
              placeholder="At least 8 characters"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Use at least 8 characters with a mix of letters and numbers."
            />
            <Input
              label="Confirm password"
              name="confirm"
              type="password"
              required
              placeholder="Re-enter your password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <label className="flex items-start gap-2.5 text-sm text-ink-soft dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
              />
              <span>
                I accept the <Link to="#" className="font-medium text-primary-600 hover:text-primary-700">Terms of Service</Link> and{' '}
                <Link to="#" className="font-medium text-primary-600 hover:text-primary-700">Privacy Policy</Link>.
              </span>
            </label>
            <Button type="submit" loading={loading} className="w-full btn-lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Create my account
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-ink-muted">
          This invitation expires in {INVITATION_EXPIRY_DAYS} days and can only be used once.
        </p>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background dark:bg-slate-950">
      {children}
    </div>
  );
}

function InvalidState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: typeof XCircle;
  title: string;
  text: string;
  action?: boolean;
}) {
  return (
    <Centered>
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-error-bg text-error-dark mb-4">
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-ink dark:text-slate-100">{title}</h1>
        <p className="text-ink-muted mt-2 text-sm">{text}</p>
        {action && (
          <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
            <ArrowRight className="h-4 w-4" /> Go to sign in
          </Link>
        )}
      </div>
    </Centered>
  );
}
