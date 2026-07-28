import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

export function DashboardLayout({ navItems, roleLabel }: { navItems: NavItem[]; roleLabel: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, school, signOut } = useAuth();

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">E</div>
          <span className="font-bold text-ink dark:text-slate-100">EduBridge</span>
        </div>
        <div className="px-3 py-4">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-ink-muted mb-2">{roleLabel}</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                  className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-light' : 'text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <Avatar name={profile?.full_name ?? ''} src={profile?.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-ink dark:text-slate-100">{profile?.full_name}</p>
              <p className="truncate text-xs text-ink-muted">{school?.name ?? ''}</p>
            </div>
            <button onClick={handleSignOut} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Menu className="h-5 w-5" /></button>
          <span className="font-bold text-ink dark:text-slate-100">EduBridge</span>
        </header>
        <main className="p-4 lg:p-8 max-w-7xl mx-auto"><Outlet /></main>
      </div>
    </div>
  );
}
