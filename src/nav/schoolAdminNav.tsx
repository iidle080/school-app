import type { ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, UsersRound, BookOpen, Library,
  CalendarCheck, BookCopy, ClipboardList, FileText, Megaphone, CalendarDays,
  UserCog, BellRing, Settings,
} from 'lucide-react';
import type { NavItem } from '@/components/layout/DashboardLayout';

export const schoolAdminNav: NavItem[] = [
  { label: 'Dashboard', to: '/school-admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Students', to: '/school-admin/students', icon: <GraduationCap className="h-5 w-5" /> },
  { label: 'Teachers', to: '/school-admin/teachers', icon: <Users className="h-5 w-5" /> },
  { label: 'Parents', to: '/school-admin/parents', icon: <UsersRound className="h-5 w-5" /> },
  { label: 'Classes', to: '/school-admin/classes', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Subjects', to: '/school-admin/subjects', icon: <Library className="h-5 w-5" /> },
  { label: 'Attendance', to: '/school-admin/attendance', icon: <CalendarCheck className="h-5 w-5" /> },
  { label: 'Homework', to: '/school-admin/homework', icon: <BookCopy className="h-5 w-5" /> },
  { label: 'Exams', to: '/school-admin/exams', icon: <ClipboardList className="h-5 w-5" /> },
  { label: 'Report Cards', to: '/school-admin/reports', icon: <FileText className="h-5 w-5" /> },
  { label: 'Announcements', to: '/school-admin/announcements', icon: <Megaphone className="h-5 w-5" /> },
  { label: 'Calendar', to: '/school-admin/calendar', icon: <CalendarDays className="h-5 w-5" /> },
  { label: 'User Management', to: '/school-admin/users', icon: <UserCog className="h-5 w-5" /> },
  { label: 'Notifications', to: '/school-admin/notifications', icon: <BellRing className="h-5 w-5" /> },
  { label: 'Settings', to: '/school-admin/settings', icon: <Settings className="h-5 w-5" /> },
];
