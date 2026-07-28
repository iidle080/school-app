import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

export function Badge({ children, variant = 'secondary', className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  const styles: Record<Variant, React.CSSProperties> = {
    primary: { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
    secondary: { background: 'rgba(160,179,198,0.15)', color: '#a0b3c6' },
    success: { background: 'rgba(16,185,129,0.15)', color: '#34d399' },
    warning: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    error: { background: 'rgba(248,113,113,0.15)', color: '#f87171' },
  };
  return <span className={cn('badge', className)} style={styles[variant]}>{children}</span>;
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
