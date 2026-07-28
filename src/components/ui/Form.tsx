import type { ReactNode } from 'react';

export function Input({ label, error, leftIcon, ...props }: { label?: string; error?: string; leftIcon?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      {label && <label className="input-label">{label}</label>}
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5c7a9a' }}>{leftIcon}</span>}
        <input className="input" style={{ ...leftIcon ? { paddingLeft: '2.5rem' } : {}, colorScheme: 'dark' }} {...props} />
      </div>
      {error && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, ...props }: { label?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      {label && <label className="input-label">{label}</label>}
      <textarea className="input min-h-[80px] resize-y" {...props} />
      {error && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, ...props }: { label?: string; error?: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      {label && <label className="input-label">{label}</label>}
      <select className="input" style={{ colorScheme: 'dark' }} {...props}>{children}</select>
      {error && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}
