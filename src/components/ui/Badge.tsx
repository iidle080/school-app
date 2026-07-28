import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

export function Badge({ children, variant = 'secondary', className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  const variants: Record<Variant, string> = {
    primary: 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-light',
    secondary: 'bg-slate-100 text-ink-soft dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    error: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  };
  return <span className={cn('inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium', variants[variant], className)}>{children}</span>;
}

export function statusBadge(status: string): { variant: Variant; label: string } {
  const map: Record<string, { variant: Variant; label: string }> = {
    present: { variant: 'success', label: 'Present' },
    absent: { variant: 'error', label: 'Absent' },
    late: { variant: 'warning', label: 'Late' },
    excused: { variant: 'secondary', label: 'Excused' },
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'secondary', label: 'Inactive' },
    draft: { variant: 'secondary', label: 'Draft' },
    scheduled: { variant: 'primary', label: 'Scheduled' },
    completed: { variant: 'primary', label: 'Completed' },
    published: { variant: 'success', label: 'Published' },
  };
  return map[status] ?? { variant: 'secondary', label: status };
}
