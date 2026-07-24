import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-muted dark:bg-slate-800 dark:text-slate-400 mb-4">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="font-semibold text-ink dark:text-slate-100">{title}</h3>
      {description && <p className="text-sm text-ink-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
