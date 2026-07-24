import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'primary' | 'neutral';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  primary: 'badge-primary',
  neutral: 'badge-neutral',
};

export function Badge({
  variant = 'neutral',
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn(VARIANT_CLASSES[variant], className)}>{children}</span>;
}

export function statusBadge(status: string): { variant: BadgeVariant; label: string } {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    pending: { variant: 'warning', label: 'Pending' },
    suspended: { variant: 'error', label: 'Suspended' },
    expired: { variant: 'neutral', label: 'Expired' },
    accepted: { variant: 'success', label: 'Accepted' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
    trial: { variant: 'primary', label: 'Trial' },
    past_due: { variant: 'warning', label: 'Past Due' },
    present: { variant: 'success', label: 'Present' },
    absent: { variant: 'error', label: 'Absent' },
    late: { variant: 'warning', label: 'Late' },
    excused: { variant: 'neutral', label: 'Excused' },
  };
  return map[status] ?? { variant: 'neutral', label: status };
}
