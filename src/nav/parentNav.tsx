import type { ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, CalendarCheck, BookCopy, ClipboardList,
  FileText, MessageSquare, Megaphone, CalendarDays, BellRing, User,
} from 'lucide-react';
import type { NavItem } from '@/components/layout/DashboardLayout';

export const parentNav: NavItem[] = [
  { label: 'Dashboard', to: '/parent', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Children', to: '/parent/children', icon: <GraduationCap className="h-5 w-5" /> },
  { label: 'Attendance', to: '/parent/attendance', icon: <CalendarCheck className="h-5 w-5" /> },
  { label: 'Homework', to: '/parent/homework', icon: <BookCopy className="h-5 w-5" /> },
  { label: 'Exam Results', to: '/parent/results', icon: <ClipboardList className="h-5 w-5" /> },
  { label: 'Report Cards', to: '/parent/reports', icon: <FileText className="h-5 w-5" /> },
  { label: 'Messages', to: '/parent/messages', icon: <MessageSquare className="h-5 w-5" /> },
  { label: 'Announcements', to: '/parent/announcements', icon: <Megaphone className="h-5 w-5" /> },
  { label: 'Calendar', to: '/parent/calendar', icon: <CalendarDays className="h-5 w-5" /> },
  { label: 'Notifications', to: '/parent/notifications', icon: <BellRing className="h-5 w-5" /> },
  { label: 'Profile', to: '/parent/profile', icon: <User className="h-5 w-5" /> },
];
