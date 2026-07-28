import { Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AcademicProvider } from '@/context/AcademicContext';
import { ToastProvider } from '@/context/ToastContext';
import { ParentProvider } from '@/context/ParentContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout, type NavItem } from '@/components/layout/DashboardLayout';
import { LayoutDashboard, BookOpen, GraduationCap, CalendarCheck, BookCopy, ClipboardList, FileText, MessageSquare, Megaphone, CalendarDays, User, Users, Building2, GraduationCap as GradIcon, Award, Settings, Bell, FolderTree, School, UserCog, ChartBar as FileBarChart } from 'lucide-react';

// Auth
import { LoginPage } from '@/pages/auth/LoginPage';

// School Admin
import { SchoolAdminDashboard } from '@/pages/school-admin/SchoolAdminDashboard';
import { SchoolAdminStudents } from '@/pages/school-admin/SchoolAdminStudents';
import { SchoolAdminStaff } from '@/pages/school-admin/SchoolAdminStaff';
import { SchoolAdminClasses } from '@/pages/school-admin/SchoolAdminClasses';
import { SchoolAdminSubjects } from '@/pages/school-admin/SchoolAdminSubjects';
import { SchoolAdminExamSessions } from '@/pages/school-admin/SchoolAdminExamSessions';
import { SchoolAdminAcademicYears } from '@/pages/school-admin/SchoolAdminAcademicYears';
import { SchoolAdminAnnouncements } from '@/pages/school-admin/SchoolAdminAnnouncements';
import { SchoolAdminProfile } from '@/pages/school-admin/SchoolAdminProfile';

// Teacher
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard';
import { TeacherStudents } from '@/pages/teacher/TeacherStudents';
import { TeacherAttendance } from '@/pages/teacher/TeacherAttendance';
import { TeacherHomework } from '@/pages/teacher/TeacherHomework';
import { TeacherExamSessions } from '@/pages/teacher/TeacherExamSessions';
import { TeacherMarks } from '@/pages/teacher/TeacherMarks';
import { TeacherResults } from '@/pages/teacher/TeacherResults';
import { TeacherMessages } from '@/pages/teacher/TeacherMessages';
import { TeacherProfile } from '@/pages/teacher/TeacherProfile';

// Parent
import { ParentDashboard } from '@/pages/parent/ParentDashboard';
import { ParentAttendance } from '@/pages/parent/ParentAttendance';
import { ParentHomework } from '@/pages/parent/ParentHomework';
import { ParentResults } from '@/pages/parent/ParentResults';
import { ParentMessages } from '@/pages/parent/ParentMessages';
import { ParentProfile } from '@/pages/parent/ParentProfile';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>;
  if (!profile) return <Navigate to="/login" replace />;
  const routes: Record<string, string> = { super_admin: '/super-admin', school_admin: '/school-admin', teacher: '/teacher', parent: '/parent' };
  return <Navigate to={routes[profile.role] ?? '/login'} replace />;
}

const schoolAdminNav: NavItem[] = [
  { label: 'Dashboard', to: '/school-admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Students', to: '/school-admin/students', icon: <GraduationCap className="h-5 w-5" /> },
  { label: 'Staff', to: '/school-admin/staff', icon: <UserCog className="h-5 w-5" /> },
  { label: 'Classes', to: '/school-admin/classes', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Subjects', to: '/school-admin/subjects', icon: <BookCopy className="h-5 w-5" /> },
  { label: 'Academic Years', to: '/school-admin/academic-years', icon: <CalendarDays className="h-5 w-5" /> },
  { label: 'Exam Sessions', to: '/school-admin/exam-sessions', icon: <ClipboardList className="h-5 w-5" /> },
  { label: 'Announcements', to: '/school-admin/announcements', icon: <Megaphone className="h-5 w-5" /> },
  { label: 'Profile', to: '/school-admin/profile', icon: <User className="h-5 w-5" /> },
];

const teacherNav: NavItem[] = [
  { label: 'Dashboard', to: '/teacher', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Students', to: '/teacher/students', icon: <GraduationCap className="h-5 w-5" /> },
  { label: 'Attendance', to: '/teacher/attendance', icon: <CalendarCheck className="h-5 w-5" /> },
  { label: 'Homework', to: '/teacher/homework', icon: <BookCopy className="h-5 w-5" /> },
  { label: 'Exam Sessions', to: '/teacher/exam-sessions', icon: <ClipboardList className="h-5 w-5" /> },
  { label: 'Marks', to: '/teacher/marks', icon: <FileText className="h-5 w-5" /> },
  { label: 'Results', to: '/teacher/results', icon: <Award className="h-5 w-5" /> },
  { label: 'Messages', to: '/teacher/messages', icon: <MessageSquare className="h-5 w-5" /> },
  { label: 'Profile', to: '/teacher/profile', icon: <User className="h-5 w-5" /> },
];

const parentNav: NavItem[] = [
  { label: 'Dashboard', to: '/parent', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Attendance', to: '/parent/attendance', icon: <CalendarCheck className="h-5 w-5" /> },
  { label: 'Homework', to: '/parent/homework', icon: <BookCopy className="h-5 w-5" /> },
  { label: 'Results', to: '/parent/results', icon: <Award className="h-5 w-5" /> },
  { label: 'Messages', to: '/parent/messages', icon: <MessageSquare className="h-5 w-5" /> },
  { label: 'Profile', to: '/parent/profile', icon: <User className="h-5 w-5" /> },
];

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AcademicProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<RoleRedirect />} />

                <Route path="/school-admin" element={<ProtectedRoute allowedRoles={['school_admin']}><DashboardLayout navItems={schoolAdminNav} roleLabel="School Admin" /></ProtectedRoute>}>
                  <Route index element={<SchoolAdminDashboard />} />
                  <Route path="students" element={<SchoolAdminStudents />} />
                  <Route path="staff" element={<SchoolAdminStaff />} />
                  <Route path="classes" element={<SchoolAdminClasses />} />
                  <Route path="subjects" element={<SchoolAdminSubjects />} />
                  <Route path="academic-years" element={<SchoolAdminAcademicYears />} />
                  <Route path="exam-sessions" element={<SchoolAdminExamSessions />} />
                  <Route path="announcements" element={<SchoolAdminAnnouncements />} />
                  <Route path="profile" element={<SchoolAdminProfile />} />
                </Route>

                <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><DashboardLayout navItems={teacherNav} roleLabel="Teacher" /></ProtectedRoute>}>
                  <Route index element={<TeacherDashboard />} />
                  <Route path="students" element={<TeacherStudents />} />
                  <Route path="attendance" element={<TeacherAttendance />} />
                  <Route path="homework" element={<TeacherHomework />} />
                  <Route path="exam-sessions" element={<TeacherExamSessions />} />
                  <Route path="marks" element={<TeacherMarks />} />
                  <Route path="results" element={<TeacherResults />} />
                  <Route path="messages" element={<TeacherMessages />} />
                  <Route path="profile" element={<TeacherProfile />} />
                </Route>

                <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentProvider><DashboardLayout navItems={parentNav} roleLabel="Parent" /></ParentProvider></ProtectedRoute>}>
                  <Route index element={<ParentDashboard />} />
                  <Route path="attendance" element={<ParentAttendance />} />
                  <Route path="homework" element={<ParentHomework />} />
                  <Route path="results" element={<ParentResults />} />
                  <Route path="messages" element={<ParentMessages />} />
                  <Route path="profile" element={<ParentProfile />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AcademicProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
