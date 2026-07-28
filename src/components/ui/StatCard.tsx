import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatCard({ label, value, icon, accent }: { label: string; value: ReactNode; icon?: ReactNode; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: '#5c7a9a' }}>{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#e6edf3' }}>{value}</p>
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: accent ?? 'rgba(59,130,246,0.15)', color: accent ? '#fff' : '#60a5fa' }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
