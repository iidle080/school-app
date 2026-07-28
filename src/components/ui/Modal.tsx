import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; description?: string;
  children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div className={cn('relative w-full rounded-2xl shadow-2xl max-h-[90vh] flex flex-col', sizes[size])}
        style={{ background: '#131929', border: '1px solid #1e2d45' }}>
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: '#1e2d45' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#e6edf3' }}>{title}</h2>
            {description && <p className="text-sm mt-1" style={{ color: '#5c7a9a' }}>{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-[#1a2236]" style={{ color: '#5c7a9a' }}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 p-5 border-t" style={{ borderColor: '#1e2d45' }}>{footer}</div>}
      </div>
    </div>
  );
}
