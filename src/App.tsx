import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, roleHomePath } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute, PublicOnlyRoute, PrivateSuperAdminRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FullPageLoader } from '@/components/ui/Spinner';
import { superAdminNav } from '@/nav/superAdminNav';
import { schoolAdminNav } from '@/nav/schoolAdminNav';
import { teacherNav } from '@/nav/teacherNav';
import { parentNav } from '@/nav/parentNav';
import { useSchool } from '@/hooks/useSchool';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { SuperAdminLoginPage } from '@/pages/auth/SuperAdminLoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { AcceptInvitationPage } from '@/pages/auth/AcceptInvitationPage';

// Super Admin pages
import { SuperAdminDashboard } from '@/pages/super-admin/SuperAdminDashboard';
import { SuperAdminSchools } from '@/pages/super-admin/SuperAdminSchools';
import { SuperAdminSubscriptions, SuperAdminAnalytics, SuperAdminUsers, SuperAdminAudit, SuperAdminSupport, SuperAdminSettings } from '@/pages/super-admin/SuperAdminPages';

// School Admin pages
import { SchoolAdminDashboard } from '@/pages/school-admin/SchoolAdminDashboard';
import { SchoolAdminStudents } from '@/pages/school-admin/SchoolAdminStudents';
import { SchoolAdminTeachers, SchoolAdminParents } from '@/pages/school-admin/SchoolAdminStaff';
import { SchoolAdminClasses, SchoolAdminSubjects, SchoolAdminAttendance, SchoolAdminHomework, SchoolAdminExams, SchoolAdminReports, SchoolAdminAnnouncements, SchoolAdminCalendar, SchoolAdminUsers, SchoolAdminNotifications, SchoolAdminSettings } from '@/pages/school-admin/SchoolAdminPages';

// Teacher pages
import { TeacherDashboard, TeacherClasses, TeacherStudents, TeacherAttendance, TeacherHomework, TeacherExams, TeacherMarks, TeacherMessages, TeacherAnnouncements, TeacherCalendar, TeacherProfile } from '@/pages/teacher/TeacherPages';

// Parent pages
import { ParentDashboard, ParentChildren, ParentAttendance, ParentHomework, ParentResults, ParentReports, ParentMessages, ParentAnnouncements, ParentCalendar, ParentNotifications, ParentProfile } from '@/pages/parent/ParentPages';
import { ParentProvider, useParent } from '@/context/ParentContext';

function RoleRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <FullPageLoader label="Setting up your workspace…" />;
  return <Navigate to={roleHomePath(profile.role)} replace />;
}

function SchoolAdminLayout() {
  const { school } = useSchool();
  return <DashboardLayout navItems={schoolAdminNav} schoolName={school?.name} schoolLogo={school?.logo_url} />;
}
function TeacherLayout() {
  const { school } = useSchool();
  return <DashboardLayout navItems={teacherNav} schoolName={school?.name} schoolLogo={school?.logo_url} />;
}
function ParentLayout() {
  const { school } = useSchool();
  return (
    <ParentProvider>
      <DashboardLayout navItems={parentNav} schoolName={school?.name} schoolLogo={school?.logo_url} headerSlot={<ChildSwitcher />} />
    </ParentProvider>
  );
}

function ChildSwitcher() {
  const { children, selectedChild, selectChild, loading } = useParent();
  const [open, setOpen] = useState(false);
  if (loading || children.length <= 1) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-ink dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <Avatar name={selectedChild?.full_name ?? ''} src={selectedChild?.photo_url} size="sm" />
        <span className="hidden sm:block max-w-[120px] truncate">{selectedChild?.full_name ?? 'Select child'}</span>
        <ChevronDown className="h-4 w-4 text-ink-muted" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card-hover z-20 animate-scale-in origin-top-right">
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Switch child</p>
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => { selectChild(c.id); setOpen(false); }}
                className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors', c.id === selectedChild?.id && 'bg-primary-50 dark:bg-primary-500/10')}
              >
                <Avatar name={c.full_name} src={c.photo_url} size="sm" />
                <span className="truncate text-ink dark:text-slate-100">{c.full_name}</span>
                {c.id === selectedChild?.id && <Check className="h-4 w-4 text-primary-600 ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/invite/:token" element={<AcceptInvitationPage />} />

              {/* Private Super Admin login — never linked publicly */}
              <Route path="/owner/login" element={<PrivateSuperAdminRoute><SuperAdminLoginPage /></PrivateSuperAdminRoute>} />

              {/* Root redirect */}
              <Route path="/" element={<RoleRedirect />} />

              {/* Super Admin portal */}
              <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['super_admin']}><DashboardLayout navItems={superAdminNav} /></ProtectedRoute>}>
                <Route index element={<SuperAdminDashboard />} />
                <Route path="schools" element={<SuperAdminSchools />} />
                <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
                <Route path="analytics" element={<SuperAdminAnalytics />} />
                <Route path="users" element={<SuperAdminUsers />} />
                <Route path="audit" element={<SuperAdminAudit />} />
                <Route path="support" element={<SuperAdminSupport />} />
                <Route path="settings" element={<SuperAdminSettings />} />
              </Route>

              {/* School Admin portal */}
              <Route path="/school-admin" element={<ProtectedRoute allowedRoles={['school_admin']}><SchoolAdminLayout /></ProtectedRoute>}>
                <Route index element={<SchoolAdminDashboard />} />
                <Route path="students" element={<SchoolAdminStudents />} />
                <Route path="teachers" element={<SchoolAdminTeachers />} />
                <Route path="parents" element={<SchoolAdminParents />} />
                <Route path="classes" element={<SchoolAdminClasses />} />
                <Route path="subjects" element={<SchoolAdminSubjects />} />
                <Route path="attendance" element={<SchoolAdminAttendance />} />
                <Route path="homework" element={<SchoolAdminHomework />} />
                <Route path="exams" element={<SchoolAdminExams />} />
                <Route path="reports" element={<SchoolAdminReports />} />
                <Route path="announcements" element={<SchoolAdminAnnouncements />} />
                <Route path="calendar" element={<SchoolAdminCalendar />} />
                <Route path="users" element={<SchoolAdminUsers />} />
                <Route path="notifications" element={<SchoolAdminNotifications />} />
                <Route path="settings" element={<SchoolAdminSettings />} />
              </Route>

              {/* Teacher portal */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
                <Route index element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="homework" element={<TeacherHomework />} />
                <Route path="exams" element={<TeacherExams />} />
                <Route path="marks" element={<TeacherMarks />} />
                <Route path="messages" element={<TeacherMessages />} />
                <Route path="announcements" element={<TeacherAnnouncements />} />
                <Route path="calendar" element={<TeacherCalendar />} />
                <Route path="profile" element={<TeacherProfile />} />
              </Route>

              {/* Parent portal */}
              <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentLayout /></ProtectedRoute>}>
                <Route index element={<ParentDashboard />} />
                <Route path="children" element={<ParentChildren />} />
                <Route path="attendance" element={<ParentAttendance />} />
                <Route path="homework" element={<ParentHomework />} />
                <Route path="results" element={<ParentResults />} />
                <Route path="reports" element={<ParentReports />} />
                <Route path="messages" element={<ParentMessages />} />
                <Route path="announcements" element={<ParentAnnouncements />} />
                <Route path="calendar" element={<ParentCalendar />} />
                <Route path="notifications" element={<ParentNotifications />} />
                <Route path="profile" element={<ParentProfile />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
