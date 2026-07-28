import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#e6edf3' }}>{title}</h1>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: '#5c7a9a' }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
