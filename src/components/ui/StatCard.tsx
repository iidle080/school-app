import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatCard({ label, value, icon, accent }: { label: string; value: ReactNode; icon?: ReactNode; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100 mt-1">{value}</p>
        </div>
        {icon && <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', accent ?? 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-light')}>{icon}</div>}
      </div>
    </div>
  );
}
