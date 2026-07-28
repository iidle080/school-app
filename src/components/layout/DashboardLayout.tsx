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
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, school, signOut } = useAuth();

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const activeItem = navItems.find((n) => location.pathname === n.to || (n.to !== '/' && location.pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: '#1e2d45', background: '#0d1117' }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Left: logo + page title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold" style={{ background: '#3b82f6' }}>E</div>
            <div className="hidden sm:block">
              <p className="font-bold leading-none" style={{ color: '#e6edf3' }}>EduBridge</p>
              <p className="text-xs mt-0.5" style={{ color: '#5c7a9a' }}>{school?.name ?? ''}</p>
            </div>
          </div>

          {/* Center: nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to}
                  className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'text-white' : 'hover:text-white')}
                  style={active ? { background: '#1a2236' } : { color: '#a0b3c6' }}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: user menu */}
          <div className="relative">
            <button onClick={() => setUserMenu((p) => !p)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-[#1a2236]">
              <Avatar name={profile?.full_name ?? ''} src={profile?.avatar_url} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none" style={{ color: '#e6edf3' }}>{profile?.full_name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#5c7a9a' }}>{roleLabel}</p>
              </div>
              <ChevronDown className="h-4 w-4" style={{ color: '#5c7a9a' }} />
            </button>
            {userMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl z-50 py-2"
                  style={{ background: '#131929', borderColor: '#1e2d45' }}>
                  <div className="px-4 py-2 border-b" style={{ borderColor: '#1e2d45' }}>
                    <p className="text-sm font-medium" style={{ color: '#e6edf3' }}>{profile?.full_name}</p>
                    <p className="text-xs" style={{ color: '#5c7a9a' }}>{profile?.phone ?? 'No phone'}</p>
                  </div>
                  <button onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[#1a2236]"
                    style={{ color: '#f87171' }}>
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="lg:hidden border-t overflow-x-auto" style={{ borderColor: '#1e2d45' }}>
          <div className="flex items-center gap-1 px-2 py-2 min-w-max">
            {navItems.map((item) => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to}
                  className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                    active ? 'text-white' : 'hover:text-white')}
                  style={active ? { background: '#1a2236' } : { color: '#a0b3c6' }}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
