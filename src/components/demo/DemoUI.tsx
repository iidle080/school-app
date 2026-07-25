import { useState } from 'react';
import { Sparkles, Copy, Check, ExternalLink, Mail, Lock, User, Building2, GraduationCap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DEMO_PASSWORD } from '@/lib/constants';
import { useDemoAuth } from '@/hooks/useDemoAuth';
import { copyCredentialsText, copyToClipboard, type DemoCredentials } from '@/lib/demo';
import { useToast } from '@/context/ToastContext';

export function DemoModeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 ring-1 ring-amber-300/50 dark:ring-amber-500/30">
      <Sparkles className="h-3 w-3" />
      Demo Mode
    </span>
  );
}

export function DemoCredentialsCard({ credentials }: { credentials: DemoCredentials }) {
  const { openDashboard, switching } = useDemoAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    copyToClipboard(copyCredentialsText(credentials));
    setCopied(true);
    toast('Login credentials copied.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const roleLabel =
    credentials.role === 'school_admin'
      ? 'School Admin'
      : credentials.role === 'teacher'
        ? 'Teacher'
        : 'Parent';

  const roleIcon =
    credentials.role === 'school_admin'
      ? <ShieldCheck className="h-4 w-4" />
      : credentials.role === 'teacher'
        ? <Building2 className="h-4 w-4" />
        : <GraduationCap className="h-4 w-4" />;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink dark:text-slate-100">Demo account ready</p>
            <p className="text-xs text-ink-muted">No email or SMS sent — log in instantly.</p>
          </div>
        </div>
        <Badge variant="success">Ready</Badge>
      </div>

      <div className="space-y-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
        <Field icon={<User className="h-3.5 w-3.5" />} label="Name" value={credentials.fullName} />
        <Field icon={roleIcon} label="Role" value={roleLabel} />
        <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={credentials.email} />
        <Field icon={<Lock className="h-3.5 w-3.5" />} label="Temporary Password" value={credentials.password} />
        {credentials.schoolName && (
          <Field icon={<Building2 className="h-3.5 w-3.5" />} label="School" value={credentials.schoolName} />
        )}
        {credentials.studentName && (
          <Field icon={<GraduationCap className="h-3.5 w-3.5" />} label="Linked Student" value={credentials.studentName} />
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button
          className="flex-1"
          loading={switching}
          onClick={() => openDashboard(credentials)}
          leftIcon={<ExternalLink className="h-4 w-4" />}
        >
          Open {roleLabel} Dashboard
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onCopy}
          leftIcon={copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        >
          Copy Login Credentials
        </Button>
      </div>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="text-ink-muted shrink-0">{icon}</span>
      <span className="text-ink-muted w-32 shrink-0">{label}</span>
      <span className="font-medium text-ink dark:text-slate-100 truncate">{value}</span>
    </div>
  );
}

export { DEMO_PASSWORD };
