import type { ReactNode } from 'react';
import {
  LayoutDashboard, BookOpen, GraduationCap, CalendarCheck, BookCopy,
  ClipboardList, FileText, MessageSquare, Megaphone, CalendarDays, User,
} from 'lucide-react';
import type { NavItem } from '@/components/layout/DashboardLayout';

export const teacherNav: NavItem[] = [
  { label: 'Dashboard', to: '/teacher', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Classes', to: '/teacher/classes', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Students', to: '/teacher/students', icon: <GraduationCap className="h-5 w-5" /> },
  { label: 'Attendance', to: '/teacher/attendance', icon: <CalendarCheck className="h-5 w-5" /> },
  { label: 'Homework', to: '/teacher/homework', icon: <BookCopy className="h-5 w-5" /> },
  { label: 'Exams', to: '/teacher/exams', icon: <ClipboardList className="h-5 w-5" /> },
  { label: 'Marks', to: '/teacher/marks', icon: <FileText className="h-5 w-5" /> },
  { label: 'Messages', to: '/teacher/messages', icon: <MessageSquare className="h-5 w-5" /> },
  { label: 'Announcements', to: '/teacher/announcements', icon: <Megaphone className="h-5 w-5" /> },
  { label: 'Calendar', to: '/teacher/calendar', icon: <CalendarDays className="h-5 w-5" /> },
  { label: 'Profile', to: '/teacher/profile', icon: <User className="h-5 w-5" /> },
];
