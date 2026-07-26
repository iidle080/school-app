import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CalendarCheck, BookCopy, ClipboardList, FileText, MessageSquare, Megaphone, CalendarDays, BellRing, User, Send, Download, Printer, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useParent } from '@/context/ParentContext';
import { useSchool } from '@/hooks/useSchool';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Form';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { RowSkeleton, CardSkeleton } from '@/components/ui/Spinner';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatDate, relativeTime, percentage, gradeFromPercentage } from '@/lib/utils';
import { ATTENDANCE_LABELS } from '@/lib/constants';
import type { Student, Attendance, Homework, ExamMark, ReportCard, Message, Notification, AppUser, ClassRow } from '@/types';

function className(classes: ClassRow[], id: string | null): string {
  if (!id) return '—';
  const c = classes.find((x) => x.id === id);
  return c ? `${c.name}${c.stream ? ` · ${c.stream}` : ''}` : '—';
}

export function ParentDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { children, classes, loading, selectChild } = useParent();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ attendance: 0, homework: 0, results: 0 });

  useEffect(() => {
    if (children.length === 0) return;
    const ids = children.map((c) => c.id);
    const classIds = children.map((c) => c.class_id).filter(Boolean) as string[];
    (async () => {
      const [att, hw, mk] = await Promise.all([
        supabase.from('attendance').select('id', { count: 'exact', head: true }).in('student_id', ids),
        supabase.from('homework').select('id', { count: 'exact', head: true }).in('class_id', classIds),
        supabase.from('exam_marks').select('id', { count: 'exact', head: true }).in('student_id', ids),
      ]);
      setStats({ attendance: att.count ?? 0, homework: hw.count ?? 0, results: mk.count ?? 0 });
    })();
  }, [children]);

  const openChild = (id: string) => {
    selectChild(id);
    navigate('/parent/children');
  };

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name.split(' ')[0] ?? ''}`} subtitle={school?.name ?? 'Parent portal'} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="My Children" value={children.length} icon={<GraduationCap className="h-5 w-5" />} />
            <StatCard label="Attendance Records" value={stats.attendance} icon={<CalendarCheck className="h-5 w-5" />} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
            <StatCard label="Homework" value={stats.homework} icon={<BookCopy className="h-5 w-5" />} accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
            <StatCard label="Exam Results" value={stats.results} icon={<ClipboardList className="h-5 w-5" />} accent="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" />
          </div>
          <Card>
            <CardHeader title="My Children" />
            {children.length === 0 ? <EmptyState title="No children linked" description="Your school admin will link your children's profiles." /> : (
              <div className="space-y-2">{children.map((c) => (
                <button key={c.id} onClick={() => openChild(c.id)} className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-colors">
                  <Avatar name={c.full_name} src={c.photo_url} size="md" />
                  <div className="flex-1">
                    <p className="font-medium text-ink dark:text-slate-100">{c.full_name}</p>
                    <p className="text-xs text-ink-muted">#{c.admission_number} · {className(classes, c.class_id)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-muted" />
                </button>
              ))}</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export function ParentChildren() {
  const { children, classes, loading, selectChild } = useParent();
  const navigate = useNavigate();

  const openChild = (id: string) => {
    selectChild(id);
    navigate('/parent/attendance');
  };

  return (
    <div>
      <PageHeader title="My Children" subtitle="Select a child to view their information." icon={<GraduationCap className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : children.length === 0 ? <Card><EmptyState title="No children linked" description="Your school admin will link your children's profiles." /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children.map((c) => (
          <Card key={c.id} hover>
            <button onClick={() => openChild(c.id)} className="w-full text-left">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={c.full_name} src={c.photo_url} size="lg" />
                <div>
                  <h3 className="font-semibold text-ink dark:text-slate-100">{c.full_name}</h3>
                  <p className="text-xs text-ink-muted">#{c.admission_number}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-ink-soft dark:text-slate-300">
                <p>Class: {className(classes, c.class_id)}</p>
                <p>Gender: <span className="capitalize">{c.gender ?? '—'}</span></p>
                <p>DOB: {c.date_of_birth ? formatDate(c.date_of_birth) : '—'}</p>
                {c.medical_notes && <p className="text-warning-dark">Medical: {c.medical_notes}</p>}
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600">
                View details <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </Card>
        ))}</div>
      )}
    </div>
  );
}

function SelectedChildBanner() {
  const { selectedChild, children, selectChild } = useParent();
  if (!selectedChild) return null;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl bg-primary-50 dark:bg-primary-500/10 p-3">
      <Avatar name={selectedChild.full_name} src={selectedChild.photo_url} size="sm" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink dark:text-slate-100">{selectedChild.full_name}</p>
        <p className="text-xs text-ink-muted">#{selectedChild.admission_number}</p>
      </div>
      {children.length > 1 && (
        <Select value={selectedChild.id} onChange={(e) => selectChild(e.target.value)} className="w-auto text-sm">
          {children.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </Select>
      )}
    </div>
  );
}

export function ParentAttendance() {
  const { selectedChild, loading } = useParent();
  const [records, setRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    if (!selectedChild) { setRecords([]); return; }
    supabase.from('attendance').select('*').eq('student_id', selectedChild.id).order('date', { ascending: false }).limit(30).then(({ data }) => setRecords((data as Attendance[]) ?? []));
  }, [selectedChild]);

  const columns: Column<Attendance>[] = [
    { key: 'date', header: 'Date', render: (a) => formatDate(a.date) },
    { key: 'status', header: 'Status', render: (a) => { const b = statusBadge(a.status); return <Badge variant={b.variant}>{b.label}</Badge>; } },
    { key: 'notes', header: 'Notes', render: (a) => a.notes ?? '—' },
  ];

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Your child's attendance records." icon={<CalendarCheck className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" description="Select a child from the switcher above." /></Card> : (
        <>
          <SelectedChildBanner />
          <Card><DataTable columns={columns} data={records} rowKey={(a) => a.id} emptyTitle="No attendance records" /></Card>
        </>
      )}
    </div>
  );
}

export function ParentHomework() {
  const { selectedChild, loading } = useParent();
  const [items, setItems] = useState<Homework[]>([]);

  useEffect(() => {
    if (!selectedChild?.class_id) { setItems([]); return; }
    supabase.from('homework').select('*').eq('class_id', selectedChild.class_id).order('created_at', { ascending: false }).then(({ data }) => setItems((data as Homework[]) ?? []));
  }, [selectedChild]);

  return (
    <div>
      <PageHeader title="Homework" subtitle="Homework assigned to your child's class." icon={<BookCopy className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          {items.length === 0 ? <Card><EmptyState title="No homework" /></Card> : (
            <div className="space-y-3">{items.map((h) => (
              <Card key={h.id}>
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink dark:text-slate-100">{h.title}</p>{h.description && <p className="text-sm text-ink-soft dark:text-slate-300 mt-1">{h.description}</p>}<p className="text-xs text-ink-muted mt-2">Due {formatDate(h.due_date)}</p></div>
                  {h.attachments?.length > 0 && <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />}>Attachments</Button>}
                </div>
              </Card>
            ))}</div>
          )}
        </>
      )}
    </div>
  );
}

export function ParentResults() {
  const { selectedChild, loading } = useParent();
  const [marks, setMarks] = useState<ExamMark[]>([]);

  useEffect(() => {
    if (!selectedChild) { setMarks([]); return; }
    supabase.from('exam_marks').select('*').eq('student_id', selectedChild.id).order('created_at', { ascending: false }).then(({ data }) => setMarks((data as ExamMark[]) ?? []));
  }, [selectedChild]);

  const columns: Column<ExamMark>[] = [
    { key: 'subject', header: 'Subject ID', render: (m) => <span className="text-xs">{m.subject_id.slice(0, 8)}</span> },
    { key: 'marks', header: 'Marks', render: (m) => `${m.marks ?? '—'} / ${m.total_marks}` },
    { key: 'pct', header: '%', render: (m) => { const p = percentage(m.marks, m.total_marks); return p !== null ? `${p}%` : '—'; } },
    { key: 'grade', header: 'Grade', render: (m) => m.grade ? <Badge variant="primary">{m.grade}</Badge> : '—' },
    { key: 'comment', header: 'Teacher Comment', render: (m) => m.teacher_comment ?? '—' },
  ];

  return (
    <div>
      <PageHeader title="Exam Results" subtitle="Your child's exam results." icon={<ClipboardList className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          <Card><DataTable columns={columns} data={marks} rowKey={(m) => m.id} emptyTitle="No results yet" /></Card>
        </>
      )}
    </div>
  );
}

export function ParentReports() {
  const { selectedChild, children, selectChild, loading } = useParent();
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [viewing, setViewing] = useState<ReportCard | null>(null);

  useEffect(() => {
    if (!selectedChild) { setReports([]); return; }
    supabase.from('report_cards').select('*').eq('student_id', selectedChild.id).eq('published', true).order('created_at', { ascending: false }).then(({ data }) => setReports((data as ReportCard[]) ?? []));
  }, [selectedChild]);

  return (
    <div>
      <PageHeader title="Report Cards" subtitle="Digital report cards for your child." icon={<FileText className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          {reports.length === 0 ? <Card><EmptyState title="No report cards" /></Card> : (
            <div className="space-y-3">{reports.map((r) => (
              <Card key={r.id}><div className="flex items-center justify-between gap-3">
                <div><p className="font-semibold text-ink dark:text-slate-100">{r.title}</p><p className="text-sm text-ink-muted">{r.overall_grade ?? '—'}</p></div>
                <Button size="sm" variant="secondary" onClick={() => setViewing(r)}>View</Button>
              </div></Card>
            ))}</div>
          )}
        </>
      )}
      {viewing && selectedChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-ink dark:text-slate-100">{viewing.title}</h2><Button size="sm" variant="secondary" leftIcon={<Printer className="h-3.5 w-3.5" />} onClick={() => window.print()}>Print</Button></div>
            <div className="space-y-3 text-sm">
              <p className="text-ink-soft dark:text-slate-300">Student: {selectedChild.full_name}</p>
              <p className="text-ink-soft dark:text-slate-300">Overall Grade: <span className="font-bold">{viewing.overall_grade ?? '—'}</span></p>
              <p className="text-ink-soft dark:text-slate-300">Overall Marks: {viewing.overall_marks ?? '—'}</p>
              {viewing.summary && <p className="text-ink-soft dark:text-slate-300">{viewing.summary}</p>}
              {viewing.teacher_remarks && <div><p className="font-semibold text-ink dark:text-slate-100">Teacher Remarks</p><p className="text-ink-soft dark:text-slate-300">{viewing.teacher_remarks}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ParentMessages() {
  const { profile } = useAuth();
  const { selectedChild, children, selectChild } = useParent();
  const { toast } = useToast();
  const { school } = useSchool();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [form, setForm] = useState({ recipient_id: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from('app_users').select('*').eq('school_id', profile.school_id).eq('role', 'teacher').then(({ data }) => setTeachers((data as AppUser[]) ?? []));
    supabase.from('messages').select('*').or(`sender_id.eq.${profile.user_id},recipient_id.eq.${profile.user_id}`).order('created_at', { ascending: false }).limit(20).then(({ data }) => setMessages((data as Message[]) ?? []));
  }, [profile?.school_id, profile?.user_id]);

  const send = async (e: FormEvent) => {
    e.preventDefault(); setSending(true);
    const childContext = selectedChild ? ` [Re: ${selectedChild.full_name} — #${selectedChild.admission_number}]` : '';
    const subjectWithContext = form.subject ? `${form.subject}${childContext}` : childContext.trim();
    const { error } = await supabase.from('messages').insert({
      school_id: profile?.school_id,
      sender_id: profile?.user_id,
      recipient_id: form.recipient_id,
      subject: subjectWithContext,
      body: form.body,
    });
    setSending(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Message sent.', 'success'); setForm({ recipient_id: '', subject: '', body: '' });
    const uid = profile?.user_id;
    if (!uid) return;
    supabase.from('messages').select('*').or(`sender_id.eq.${uid},recipient_id.eq.${uid}`).order('created_at', { ascending: false }).limit(20).then(({ data }) => setMessages((data as Message[]) ?? []));
  };

  return (
    <div>
      <PageHeader title="Messages" subtitle="Communicate with your children's teachers." icon={<MessageSquare className="h-5 w-5" />} />
      {children.length > 1 && <SelectedChildBanner />}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="New Message" /><form onSubmit={send} className="space-y-4">
          {selectedChild && (
            <div className="rounded-xl bg-primary-50 dark:bg-primary-500/10 p-3 text-sm text-ink-soft dark:text-slate-300">
              About: <span className="font-medium text-ink dark:text-slate-100">{selectedChild.full_name}</span> (#{selectedChild.admission_number})
            </div>
          )}
          <Select label="Teacher" required value={form.recipient_id} onChange={(e) => setForm((f) => ({ ...f, recipient_id: e.target.value }))}><option value="">Select…</option>{teachers.map((t) => <option key={t.id} value={t.user_id}>{t.full_name}</option>)}</Select>
          <Input label="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder={selectedChild ? `Re: ${selectedChild.full_name}` : ''} />
          <Textarea label="Message" required value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <Button type="submit" loading={sending} leftIcon={<Send className="h-4 w-4" />}>Send</Button>
        </form></Card>
        <Card><CardHeader title="Recent Messages" />{messages.length === 0 ? <EmptyState title="No messages yet" /> : (
          <div className="space-y-3">{messages.map((m) => (
            <div key={m.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
              <div className="flex items-center justify-between"><p className="text-sm font-medium text-ink dark:text-slate-100">{m.sender_id === profile?.user_id ? 'You' : 'Teacher'}</p><p className="text-xs text-ink-muted">{relativeTime(m.created_at)}</p></div>
              {m.subject && <p className="text-xs font-medium text-ink-soft mt-1">{m.subject}</p>}
              <p className="text-sm text-ink-soft dark:text-slate-300 mt-1">{m.body}</p>
            </div>
          ))}</div>
        )}</Card>
      </div>
    </div>
  );
}

export function ParentAnnouncements() {
  const { profile } = useAuth();
  const { selectedChild, classes, loading } = useParent();
  const [items, setItems] = useState<any[]>([]);
  const [loadDone, setLoadDone] = useState(true);

  useEffect(() => {
    if (!profile?.school_id) return;
    setLoadDone(false);
    const childClassIds = selectedChild?.class_id ? [selectedChild.class_id] : classes.map((c) => c.id);
    supabase.from('announcements').select('*').eq('school_id', profile.school_id).in('audience', ['school', 'emergency', 'class']).order('created_at', { ascending: false }).then(({ data }) => {
      const filtered = (data ?? []).filter((a: any) => {
        if (a.audience === 'school' || a.audience === 'emergency') return true;
        if (a.audience === 'class' && a.class_id) return childClassIds.includes(a.class_id);
        return false;
      });
      setItems(filtered); setLoadDone(true);
    });
  }, [profile?.school_id, selectedChild, classes]);

  return (
    <div>
      <PageHeader title="Announcements" subtitle="School-wide and class announcements." icon={<Megaphone className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          {!loadDone ? <RowSkeleton /> : items.length === 0 ? <Card><EmptyState title="No announcements" /></Card> : (
            <div className="space-y-3">{items.map((a) => <Card key={a.id}><p className="font-semibold text-ink dark:text-slate-100">{a.title}</p><p className="text-sm text-ink-soft dark:text-slate-300 mt-1">{a.body}</p><p className="text-xs text-ink-muted mt-2">{relativeTime(a.created_at)}</p></Card>)}</div>
          )}
        </>
      )}
    </div>
  );
}

export function ParentCalendar() {
  const { profile } = useAuth();
  const { selectedChild, classes, loading } = useParent();
  const [events, setEvents] = useState<any[]>([]);
  const [loadDone, setLoadDone] = useState(true);

  useEffect(() => {
    if (!profile?.school_id) return;
    setLoadDone(false);
    const childClassIds = selectedChild?.class_id ? [selectedChild.class_id] : classes.map((c) => c.id);
    supabase.from('calendar_events').select('*').eq('school_id', profile.school_id).order('start_at', { ascending: true }).then(({ data }) => {
      const filtered = (data ?? []).filter((e: any) => {
        if (!e.class_id) return true;
        return childClassIds.includes(e.class_id);
      });
      setEvents(filtered); setLoadDone(true);
    });
  }, [profile?.school_id, selectedChild, classes]);

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Upcoming events for your child." icon={<CalendarDays className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          {!loadDone ? <RowSkeleton /> : events.length === 0 ? <Card><EmptyState title="No events" /></Card> : (
            <Card><div className="divide-y divide-slate-100 dark:divide-slate-800">{events.map((e) => <div key={e.id} className="py-3"><p className="font-medium text-ink dark:text-slate-100">{e.title}</p><p className="text-xs text-ink-muted">{formatDate(e.start_at)}</p></div>)}</div></Card>
          )}
        </>
      )}
    </div>
  );
}

export function ParentNotifications() {
  const { profile } = useAuth();
  const { selectedChild, children, loading } = useParent();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!profile?.user_id) return;
    supabase.from('notifications').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).then(({ data }) => setItems((data as Notification[]) ?? []));
  }, [profile?.user_id]);

  const childName = (id: string | null) => children.find((c) => c.id === id)?.full_name;

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Your recent notifications." icon={<BellRing className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : (
        <>
          {children.length > 1 && <SelectedChildBanner />}
          {items.length === 0 ? <Card><EmptyState title="No notifications" /></Card> : (
            <Card><div className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((n) => (
              <div key={n.id} className="py-3">
                <p className="text-sm font-medium text-ink dark:text-slate-100">{n.title}</p>
                {n.body && <p className="text-xs text-ink-muted">{n.body}</p>}
                {childName((n as any).student_id) && <p className="text-xs text-primary-600 mt-0.5">Re: {childName((n as any).student_id)}</p>}
                <p className="text-xs text-ink-muted mt-0.5">{relativeTime(n.created_at)}</p>
              </div>
            ))}</div></Card>
          )}
        </>
      )}
    </div>
  );
}

export function ParentProfile() {
  const { profile } = useAuth();
  const { school } = useSchool();
  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your parent profile." icon={<User className="h-5 w-5" />} />
      <div className="max-w-2xl"><Card>
        <div className="flex items-center gap-4 mb-4"><Avatar name={profile?.full_name ?? ''} src={profile?.avatar_url} size="lg" /><div><h2 className="text-lg font-bold text-ink dark:text-slate-100">{profile?.full_name}</h2><p className="text-sm text-ink-muted">{school?.name}</p></div></div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><p className="text-ink-muted">Role</p><p className="font-medium text-ink dark:text-slate-100">Parent</p></div>
          <div><p className="text-ink-muted">Phone</p><p className="font-medium text-ink dark:text-slate-100">{profile?.phone ?? '—'}</p></div>
        </div>
      </Card></div>
    </div>
  );
}
