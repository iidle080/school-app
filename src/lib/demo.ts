import { supabase } from '@/lib/supabase';
import { DEMO_PASSWORD, DEMO_EMAIL_DOMAIN } from '@/lib/constants';
import type { UserRole } from '@/types';

export interface DemoCredentials {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  schoolId: string;
  schoolName?: string;
  studentName?: string;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
}

export function demoEmailFor(role: UserRole, name: string, schoolSlug: string, sequence: number): string {
  const prefix = role === 'school_admin' ? 'admin' : role === 'teacher' ? 'teacher' : 'parent';
  const slug = slugify(name).slice(0, 12) || 'user';
  return `${prefix}${sequence}@${schoolSlug || 'school'}.${DEMO_EMAIL_DOMAIN}`;
}

export function schoolSlugFromName(name: string): string {
  return slugify(name) || 'school';
}

export async function createDemoUser(params: {
  role: UserRole;
  fullName: string;
  schoolId: string;
  email: string;
  studentId?: string;
}): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('demo-create-user', {
    body: {
      email: params.email,
      password: DEMO_PASSWORD,
      full_name: params.fullName,
      role: params.role,
      school_id: params.schoolId,
      student_id: params.studentId ?? null,
    },
  });
  if (error) return { error: error.message };
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: String((data as { error: unknown }).error) };
  }
  return { error: null };
}

export function copyCredentialsText(c: DemoCredentials): string {
  const lines = [
    `EduBridge Demo Login`,
    `Name: ${c.fullName}`,
    `Email: ${c.email}`,
    `Password: ${c.password}`,
  ];
  if (c.schoolName) lines.push(`School: ${c.schoolName}`);
  if (c.studentName) lines.push(`Linked Student: ${c.studentName}`);
  return lines.join('\n');
}

export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}
