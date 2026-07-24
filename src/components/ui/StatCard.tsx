import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  trend?: { value: string; positive?: boolean };
  accent?: string;
  className?: string;
}

export function StatCard({ label, value, icon, trend, accent = 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-light', className }: StatCardProps) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-muted truncate">{label}</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100 mt-1.5">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium mt-2', trend.positive ? 'text-success-dark' : 'text-error-dark')}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shrink-0', accent)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
