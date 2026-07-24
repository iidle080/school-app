import { useEffect, useState } from 'react';
import { GraduationCap, Users, UsersRound, BookOpen, BookCopy, ClipboardList, TrendingUp, CalendarDays, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSchool } from '@/hooks/useSchool';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { formatDate, relativeTime } from '@/lib/utils';
import type { Announcement, CalendarEvent, Student } from '@/types';

export function SchoolAdminDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ students: 0, teachers: 0, parents: 0, classes: 0, homework: 0, exams: 0 });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!profile?.school_id) return;
    const sid = profile.school_id;
    (async () => {
      const [st, t, p, c, hw, ex, rs, an, ev] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', sid),
        supabase.from('app_users').select('id', { count: 'exact', head: true }).eq('school_id', sid).eq('role', 'teacher'),
        supabase.from('app_users').select('id', { count: 'exact', head: true }).eq('school_id', sid).eq('role', 'parent'),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', sid),
        supabase.from('homework').select('id', { count: 'exact', head: true }).eq('school_id', sid),
        supabase.from('exams').select('id', { count: 'exact', head: true }).eq('school_id', sid),
        supabase.from('students').select('*').eq('school_id', sid).order('created_at', { ascending: false }).limit(5),
        supabase.from('announcements').select('*').eq('school_id', sid).order('created_at', { ascending: false }).limit(4),
        supabase.from('calendar_events').select('*').eq('school_id', sid).order('start_at', { ascending: true }).limit(4),
      ]);
      setCounts({ students: st.count ?? 0, teachers: t.count ?? 0, parents: p.count ?? 0, classes: c.count ?? 0, homework: hw.count ?? 0, exams: ex.count ?? 0 });
      setRecentStudents((rs.data as Student[]) ?? []);
      setAnnouncements((an.data as Announcement[]) ?? []);
      setEvents((ev.data as CalendarEvent[]) ?? []);
      setLoading(false);
    })();
  }, [profile?.school_id]);

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name.split(' ')[0] ?? ''}`} subtitle={school ? `Managing ${school.name}` : 'School dashboard'} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <StatCard label="Students" value={counts.students} icon={<GraduationCap className="h-5 w-5" />} />
            <StatCard label="Teachers" value={counts.teachers} icon={<Users className="h-5 w-5" />} accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
            <StatCard label="Parents" value={counts.parents} icon={<UsersRound className="h-5 w-5" />} accent="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400" />
            <StatCard label="Classes" value={counts.classes} icon={<BookOpen className="h-5 w-5" />} accent="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400" />
            <StatCard label="Homework Items" value={counts.homework} icon={<BookCopy className="h-5 w-5" />} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
            <StatCard label="Exams" value={counts.exams} icon={<ClipboardList className="h-5 w-5" />} accent="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Recent Students" action={<Link to="/school-admin/students" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>} />
              <div className="space-y-2">
                {recentStudents.map((s) => {
                  const b = statusBadge(s.enrollment_status);
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <Avatar name={s.full_name} src={s.photo_url} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink dark:text-slate-100 truncate">{s.full_name}</p>
                        <p className="text-xs text-ink-muted">Adm. #{s.admission_number}</p>
                      </div>
                      <Badge variant={b.variant}>{b.label}</Badge>
                    </div>
                  );
                })}
                {recentStudents.length === 0 && <p className="text-sm text-ink-muted py-6 text-center">No students enrolled yet.</p>}
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader title="Announcements" />
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id}>
                      <p className="text-sm font-medium text-ink dark:text-slate-100 truncate">{a.title}</p>
                      <p className="text-xs text-ink-muted">{relativeTime(a.created_at)}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && <p className="text-sm text-ink-muted py-4 text-center">No announcements.</p>}
                </div>
              </Card>

              <Card>
                <CardHeader title="Upcoming Events" />
                <div className="space-y-3">
                  {events.map((e) => (
                    <div key={e.id} className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-ink dark:text-slate-100 truncate">{e.title}</p>
                        <p className="text-xs text-ink-muted">{formatDate(e.start_at)}</p>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && <p className="text-sm text-ink-muted py-4 text-center">No events.</p>}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
