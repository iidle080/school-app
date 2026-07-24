export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent';

export type SchoolStatus = 'pending' | 'active' | 'suspended' | 'expired';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export type InvitationRole = 'school_admin' | 'teacher' | 'parent';

export type EnrollmentStatus = 'active' | 'transferred' | 'graduated' | 'suspended' | 'inactive';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type Plan = 'starter' | 'growth' | 'enterprise';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended';

export type Audience = 'school' | 'class' | 'staff' | 'emergency';

export type EventType = 'event' | 'exam' | 'meeting' | 'holiday' | 'sports' | 'deadline';

export type NotificationType =
  | 'attendance'
  | 'homework'
  | 'announcement'
  | 'message'
  | 'exam_result'
  | 'calendar'
  | 'invitation'
  | 'system';

export interface AppUser {
  id: string;
  user_id: string;
  school_id: string | null;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  principal_name: string | null;
  admin_name: string | null;
  admin_email: string | null;
  admin_phone: string | null;
  status: SchoolStatus;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  school_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  seats: number;
  student_limit: number | null;
  billing_cycle: 'monthly' | 'annual';
  amount: number;
  currency: string;
  trial_ends_at: string | null;
  renews_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  school_id: string | null;
  token: string;
  role: InvitationRole;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  status: InvitationStatus;
  channel: 'email' | 'sms';
  metadata: Record<string, unknown>;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  admission_number: string;
  full_name: string;
  photo_url: string | null;
  gender: 'male' | 'female' | 'other' | null;
  date_of_birth: string | null;
  class_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
  enrollment_status: EnrollmentStatus;
  admitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassRow {
  id: string;
  school_id: string;
  term_id: string | null;
  name: string;
  grade_level: string | null;
  stream: string | null;
  class_teacher_id: string | null;
  capacity: number;
  created_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Term {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string | null;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
}

export interface Homework {
  id: string;
  school_id: string;
  class_id: string;
  subject_id: string | null;
  teacher_id: string;
  title: string;
  description: string | null;
  attachments: Array<{ name: string; url: string }>;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  school_id: string;
  term_id: string | null;
  name: string;
  exam_type: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface ExamMark {
  id: string;
  school_id: string;
  exam_id: string;
  student_id: string;
  subject_id: string;
  class_id: string | null;
  marks: number | null;
  total_marks: number;
  grade: string | null;
  teacher_comment: string | null;
  entered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportCard {
  id: string;
  school_id: string;
  student_id: string;
  term_id: string | null;
  academic_year_id: string | null;
  title: string;
  summary: string | null;
  overall_grade: string | null;
  overall_marks: number | null;
  class_position: number | null;
  teacher_remarks: string | null;
  principal_remarks: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  school_id: string;
  author_id: string;
  title: string;
  body: string;
  audience: Audience;
  class_id: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  start_at: string;
  end_at: string | null;
  location: string | null;
  class_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  school_id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  attachments: Array<{ name: string; url: string }>;
  read_at: string | null;
  parent_message_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  school_id: string | null;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  school_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}
