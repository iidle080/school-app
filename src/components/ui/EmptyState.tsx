import type { ReactNode } from 'react';

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3" style={{ color: '#253352' }}>{icon}</div>}
      <p className="font-medium" style={{ color: '#e6edf3' }}>{title}</p>
      {description && <p className="text-sm mt-1 max-w-sm" style={{ color: '#5c7a9a' }}>{description}</p>}
    </div>
  );
}
