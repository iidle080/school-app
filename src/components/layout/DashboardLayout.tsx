import { type ReactNode, useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogOut, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { ROLE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  schoolName?: string | null;
  schoolLogo?: string | null;
}

export function DashboardLayout({ navItems, schoolName, schoolLogo }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const activeItem = navItems.find((n) => location.pathname.startsWith(n.to));

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-30">
        <SidebarContent
          navItems={navItems}
          schoolName={schoolName}
          schoolLogo={schoolLogo}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col animate-slide-in-right">
            <SidebarContent
              navItems={navItems}
              schoolName={schoolName}
              schoolLogo={schoolLogo}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden rounded-lg p-2 text-ink-soft hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-ink dark:text-slate-100 truncate">
              {activeItem?.label ?? 'Dashboard'}
            </h2>
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-ink-soft hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <button className="relative rounded-lg p-2 text-ink-soft hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Avatar name={profile?.full_name ?? 'User'} src={profile?.avatar_url} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-ink dark:text-slate-100 leading-tight max-w-[140px] truncate">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-ink-muted leading-tight">
                  {profile ? ROLE_LABELS[profile.role] : ''}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-ink-muted" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card-hover z-20 animate-scale-in origin-top-right">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-medium text-ink dark:text-slate-100 truncate">{profile?.full_name}</p>
                    <p className="text-xs text-ink-muted truncate">{profile?.phone ?? profile?.user_id}</p>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-ink-soft hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page body */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  navItems,
  schoolName,
  schoolLogo,
  onNavigate,
}: {
  navItems: NavItem[];
  schoolName?: string | null;
  schoolLogo?: string | null;
  onNavigate: () => void;
}) {
  const { profile } = useAuth();
  return (
    <>
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Logo size="sm" />
        <button onClick={onNavigate} className="lg:hidden rounded-lg p-1.5 text-ink-muted hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      {(schoolName || schoolLogo) && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
            {schoolLogo ? (
              <img src={schoolLogo} alt={schoolName ?? ''} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700 text-xs font-bold">
                {(schoolName ?? 'S').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink dark:text-slate-100 truncate">{schoolName}</p>
              <p className="text-[11px] text-ink-muted">{profile ? ROLE_LABELS[profile.role] : ''}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Menu</p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === navItems[0]?.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn('sidebar-link', isActive && 'sidebar-link-active')
                }
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <Avatar name={profile?.full_name ?? 'User'} src={profile?.avatar_url} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink dark:text-slate-100 truncate">{profile?.full_name}</p>
            <p className="text-[11px] text-ink-muted">{profile ? ROLE_LABELS[profile.role] : ''}</p>
          </div>
        </div>
      </div>
    </>
  );
}
