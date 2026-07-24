import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  dark?: boolean;
}

const SIZES = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-base' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-lg' },
  lg: { box: 'h-12 w-12', icon: 'h-6 w-6', text: 'text-2xl' },
};

export function Logo({ size = 'md', showText = true, className, dark }: LogoProps) {
  const s = SIZES[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm', s.box)}>
        <GraduationCap className={s.icon} />
      </div>
      {showText && (
        <span className={cn('font-extrabold tracking-tight', s.text, dark ? 'text-white' : 'text-ink dark:text-slate-100')}>
          Edu<span className="text-primary-600 dark:text-primary-light">Bridge</span>
        </span>
      )}
    </div>
  );
}

export { APP_NAME };
