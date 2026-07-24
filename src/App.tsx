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
  return <DashboardLayout navItems={parentNav} schoolName={school?.name} schoolLogo={school?.logo_url} />;
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
