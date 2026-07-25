import type { UserRole } from '@/types';

export const APP_NAME = 'EduBridge';

// Demo Mode — temporary. When email/SMS services are connected, set to false
// or remove to restore the production invitation-only onboarding flow.
export const DEMO_MODE = true;
export const DEMO_PASSWORD = 'Password123!';
export const DEMO_EMAIL_DOMAIN = 'edubridge.demo';

export const PRIVATE_SUPER_ADMIN_PATH = '/owner/login';

export const INVITATION_EXPIRY_DAYS = 7;

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  teacher: 'Teacher',
  parent: 'Parent',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Platform owner with full access to all schools and system settings.',
  school_admin: 'Manages one school — students, staff, classes, and communications.',
  teacher: 'Manages classroom activities, attendance, homework, and marks.',
  parent: 'Monitors their children\'s education, attendance, and results.',
};

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  super_admin: '/super-admin',
  school_admin: '/school-admin',
  teacher: '/teacher',
  parent: '/parent',
};

export const ROLE_THEME_ACCENT: Record<UserRole, string> = {
  super_admin: 'from-slate-800 to-slate-900',
  school_admin: 'from-primary-600 to-primary-800',
  teacher: 'from-emerald-600 to-emerald-800',
  parent: 'from-sky-500 to-primary-700',
};

export const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

export const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  starter: { monthly: 4999, annual: 49990 },
  growth: { monthly: 9999, annual: 99990 },
  enterprise: { monthly: 19999, annual: 199990 },
};

export const SCHOOL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  suspended: 'Suspended',
  expired: 'Expired',
};

export const INVITATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Event',
  exam: 'Exam',
  meeting: 'Meeting',
  holiday: 'Holiday',
  sports: 'Sports',
  deadline: 'Deadline',
};

export const AUDIENCE_LABELS: Record<string, string> = {
  school: 'Whole School',
  class: 'Class',
  staff: 'Staff',
  emergency: 'Emergency',
};
