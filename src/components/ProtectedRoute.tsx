import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/ui/Spinner';
import type { UserRole } from '@/types';
import { ROLE_HOME_PATH, PRIVATE_SUPER_ADMIN_PATH } from '@/lib/constants';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!session) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${from}`} replace />;
  }

  if (!profile) {
    return <FullPageLoader label="Setting up your workspace…" />;
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={ROLE_HOME_PATH[profile.role]} replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (session && profile) {
    return <Navigate to={ROLE_HOME_PATH[profile.role]} replace />;
  }
  return <>{children}</>;
}

/** Super Admin login uses a private URL known only to the platform owner. */
export function PrivateSuperAdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (session && profile) {
    return <Navigate to={ROLE_HOME_PATH[profile.role]} replace />;
  }
  return <>{children}</>;
}

export { PRIVATE_SUPER_ADMIN_PATH };
