import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { GraduationCap, ShieldCheck, MessageCircle, CalendarCheck } from 'lucide-react';

const FEATURES = [
  { icon: GraduationCap, title: 'Unified School Management', text: 'Students, classes, attendance, and report cards — all in one place.' },
  { icon: MessageCircle, title: 'Direct Parent Communication', text: 'Message teachers, receive updates, and stay informed in real time.' },
  { icon: CalendarCheck, title: 'Calendar & Announcements', text: 'Never miss an exam, event, or school-wide announcement again.' },
  { icon: ShieldCheck, title: 'Secure & Private', text: 'Every school\'s data is fully isolated. Your information stays yours.' },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative">
          <Logo size="lg" dark />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">
            The bridge between schools, teachers, and parents.
          </h1>
          <p className="mt-4 text-primary-100 text-lg">
            EduBridge connects your entire school community on one secure, modern platform.
          </p>
          <div className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-primary-100 mt-0.5">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-primary-200">
          © {new Date().getFullYear()} EduBridge. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center p-6 sm:p-10 bg-background dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
