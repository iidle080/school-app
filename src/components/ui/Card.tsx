import type { ReactNode } from 'react';

export function Card({ children, className, hover }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={`card p-5 ${hover ? 'transition-shadow hover:shadow-lg' : ''} ${className ?? ''}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold" style={{ color: '#e6edf3' }}>{title}</h3>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: '#5c7a9a' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
