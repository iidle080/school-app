import type { ReactNode } from 'react';
import {
  LayoutDashboard, Building2, CreditCard, BarChart3, Users, ScrollText,
  LifeBuoy, Settings,
} from 'lucide-react';
import type { NavItem } from '@/components/layout/DashboardLayout';

export const superAdminNav: NavItem[] = [
  { label: 'Dashboard', to: '/super-admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Schools', to: '/super-admin/schools', icon: <Building2 className="h-5 w-5" /> },
  { label: 'Subscriptions', to: '/super-admin/subscriptions', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Analytics', to: '/super-admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Platform Users', to: '/super-admin/users', icon: <Users className="h-5 w-5" /> },
  { label: 'Audit Logs', to: '/super-admin/audit', icon: <ScrollText className="h-5 w-5" /> },
  { label: 'Support', to: '/super-admin/support', icon: <LifeBuoy className="h-5 w-5" /> },
  { label: 'System Settings', to: '/super-admin/settings', icon: <Settings className="h-5 w-5" /> },
];
