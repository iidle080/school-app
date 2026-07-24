import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, BookOpen, GraduationCap, CalendarCheck, BookCopy, ClipboardList, FileText, MessageSquare, Megaphone, CalendarDays, User, Plus, Send, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSchool } from '@/hooks/useSchool';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { RowSkeleton, CardSkeleton } from '@/components/ui/Spinner';
import { formatDate, relativeTime, percentage, gradeFromPercentage } from '@/lib/utils';
import { ATTENDANCE_LABELS } from '@/lib/constants';
import type { Student, Homework, Exam, ExamMark, ClassRow, Subject, Message, AppUser } from '@/types';

export function TeacherDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ classes: 0, students: 0, homework: 0, exams: 0 });

  useEffect(() => {
    if (!profile?.school_id) return;
    const sid = profile.school_id;
    (async () => {
      const [c, s, hw, ex] = await Promise.all([
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', sid).eq('class_teacher_id', profile.id),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', sid),
        supabase.from('homework').select('id', { count: 'exact', head: true }).eq('school_id', sid).eq('teacher_id', profile.user_id),
        supabase.from('exams').select('id', { count: 'exact', head: true }).eq('school_id', sid),
      ]);
      setCounts({ classes: c.count ?? 0, students: s.count ?? 0, homework: hw.count ?? 0, exams: ex.count ?? 0 });
      setLoading(false);
    })();
  }, [profile]);

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name.split(' ')[0] ?? ''}`} subtitle={school?.name ?? 'Teacher portal'} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My Classes" value={counts.classes} icon={<BookOpen className="h-5 w-5" />} />
          <StatCard label="Students" value={counts.students} icon={<GraduationCap className="h-5 w-5" />} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
          <StatCard label="Homework" value={counts.homework} icon={<BookCopy className="h-5 w-5" />} accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
          <StatCard label="Exams" value={counts.exams} icon={<ClipboardList className="h-5 w-5" />} accent="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" />
        </div>
      )}
    </div>
  );
}

export function TeacherClasses() {
  const { profile } = useAuth();
  const { classes, loading } = useSchoolData();
  const myClasses = classes.filter((c) => c.class_teacher_id === profile?.id);

  return (
    <div>
      <PageHeader title="My Classes" subtitle="Classes you are assigned to as class teacher." icon={<BookOpen className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : myClasses.length === 0 ? <Card><EmptyState title="No classes assigned" description="Your school admin will assign classes to you." /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myClasses.map((c) => (
            <Card key={c.id} hover>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-light"><BookOpen className="h-5 w-5" /></div>
                <Badge variant="primary">{c.capacity} seats</Badge>
              </div>
              <h3 className="font-semibold text-ink dark:text-slate-100">{c.name}</h3>
              <p className="text-sm text-ink-muted mt-1">{c.grade_level ?? '—'} · Stream {c.stream ?? '—'}</p>
              <div className="mt-4 flex gap-2">
                <Link to="/teacher/students"><Button size="sm" variant="secondary">View Students</Button></Link>
                <Link to="/teacher/attendance"><Button size="sm" variant="ghost">Attendance</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function TeacherStudents() {
  const { students, classes, loading } = useSchoolData();
  const columns: Column<Student>[] = [
    { key: 'name', header: 'Student', render: (s) => <div className="flex items-center gap-3"><Avatar name={s.full_name} src={s.photo_url} size="sm" /><div><p className="font-medium text-ink dark:text-slate-100">{s.full_name}</p><p className="text-xs text-ink-muted">#{s.admission_number}</p></div></div> },
    { key: 'class', header: 'Class', render: (s) => classes.find((c) => c.id === s.class_id)?.name ?? '—' },
    { key: 'status', header: 'Status', render: (s) => { const b = statusBadge(s.enrollment_status); return <Badge variant={b.variant}>{b.label}</Badge>; } },
  ];
  return (
    <div>
      <PageHeader title="Students" subtitle="Students in your school." icon={<GraduationCap className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={students} rowKey={(s) => s.id} searchKeys={['full_name', 'admission_number']} searchPlaceholder="Search students…" emptyTitle="No students" /></Card>}
    </div>
  );
}

export function TeacherAttendance() {
  return <AttendanceRecorder />;
}

export function TeacherHomework() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { classes, subjects } = useSchoolData();
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', class_id: '', subject_id: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!profile?.school_id) return;
    setLoading(true);
    supabase.from('homework').select('*').eq('school_id', profile.school_id).eq('teacher_id', profile.user_id).order('created_at', { ascending: false }).then(({ data }) => { setItems((data as Homework[]) ?? []); setLoading(false); });
  };
  useEffect(load, [profile]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('homework').insert({ school_id: profile?.school_id, class_id: form.class_id, subject_id: form.subject_id || null, teacher_id: profile?.user_id, title: form.title, description: form.description, due_date: form.due_date });
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Homework assigned.', 'success'); setShowForm(false); setForm({ title: '', description: '', class_id: '', subject_id: '', due_date: '' }); load();
  };

  const columns: Column<Homework>[] = [
    { key: 'title', header: 'Title', render: (h) => <span className="font-medium text-ink dark:text-slate-100">{h.title}</span> },
    { key: 'class', header: 'Class', render: (h) => classes.find((c) => c.id === h.class_id)?.name ?? '—' },
    { key: 'subject', header: 'Subject', render: (h) => subjects.find((s) => s.id === h.subject_id)?.name ?? '—' },
    { key: 'due', header: 'Due', render: (h) => formatDate(h.due_date) },
  ];

  return (
    <div>
      <PageHeader title="Homework" subtitle="Assign and track homework for your classes." icon={<BookCopy className="h-5 w-5" />} action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>Assign Homework</Button>} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={items} rowKey={(h) => h.id} searchKeys={['title']} searchPlaceholder="Search homework…" emptyTitle="No homework yet" /></Card>}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Assign Homework" footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="hw-form" type="submit" loading={saving}>Assign</Button></>}>
        <form id="hw-form" onSubmit={submit} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Class" required value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}><option value="">Select…</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Select label="Subject" value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}><option value="">Select…</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          </div>
          <Input label="Due date" type="date" required value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
        </form>
      </Modal>
    </div>
  );
}

export function TeacherExams() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', exam_type: 'midterm', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);

  const load = () => { if (!profile?.school_id) return; setLoading(true); supabase.from('exams').select('*').eq('school_id', profile.school_id).order('created_at', { ascending: false }).then(({ data }) => { setExams((data as Exam[]) ?? []); setLoading(false); }); };
  useEffect(load, [profile?.school_id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('exams').insert({ school_id: profile?.school_id, name: form.name, exam_type: form.exam_type, start_date: form.start_date || null, end_date: form.end_date || null });
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Exam created.', 'success'); setShowForm(false); setForm({ name: '', exam_type: 'midterm', start_date: '', end_date: '' }); load();
  };

  const columns: Column<Exam>[] = [
    { key: 'name', header: 'Exam', render: (x) => <span className="font-medium text-ink dark:text-slate-100">{x.name}</span> },
    { key: 'type', header: 'Type', render: (x) => <Badge variant="primary" className="capitalize">{x.exam_type}</Badge> },
    { key: 'start', header: 'Start', render: (x) => formatDate(x.start_date) },
  ];

  return (
    <div>
      <PageHeader title="Exams" subtitle="Create exams for your subjects." icon={<ClipboardList className="h-5 w-5" />} action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>Add Exam</Button>} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={exams} rowKey={(x) => x.id} searchKeys={['name']} emptyTitle="No exams yet" /></Card>}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Exam" footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="ex-form" type="submit" loading={saving}>Create</Button></>}>
        <form id="ex-form" onSubmit={submit} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select label="Type" value={form.exam_type} onChange={(e) => setForm((f) => ({ ...f, exam_type: e.target.value }))}><option value="midterm">Midterm</option><option value="endterm">End Term</option><option value="quiz">Quiz</option><option value="final">Final</option></Select>
          <div className="grid sm:grid-cols-2 gap-4"><Input label="Start date" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} /><Input label="End date" type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} /></div>
        </form>
      </Modal>
    </div>
  );
}

export function TeacherMarks() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { students, subjects, loading } = useSchoolData();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marks, setMarks] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from('exams').select('*').eq('school_id', profile.school_id).order('created_at', { ascending: false }).then(({ data }) => setExams((data as Exam[]) ?? []));
  }, [profile?.school_id]);

  const loadMarks = async () => {
    if (!selectedExam || !selectedSubject || !profile?.school_id) return;
    const { data } = await supabase.from('exam_marks').select('student_id, marks').eq('exam_id', selectedExam).eq('subject_id', selectedSubject).eq('school_id', profile.school_id);
    const m = new Map<string, string>();
    (data ?? []).forEach((r: { student_id: string; marks: string | number | null }) => m.set(r.student_id, r.marks !== null ? String(r.marks) : ''));
    setMarks(m);
  };
  useEffect(() => { loadMarks(); }, [selectedExam, selectedSubject]);

  const save = async () => {
    setSaving(true);
    const rows = Array.from(marks.entries()).filter(([, v]) => v !== '').map(([studentId, val]) => ({
      school_id: profile?.school_id, exam_id: selectedExam, student_id: studentId, subject_id: selectedSubject,
      marks: Number(val), total_marks: 100, grade: gradeFromPercentage(percentage(Number(val), 100) ?? 0), entered_by: profile?.user_id,
    }));
    if (rows.length) {
      const { error } = await supabase.from('exam_marks').upsert(rows, { onConflict: 'exam_id,student_id,subject_id' });
      if (error) { setSaving(false); toast(error.message, 'error'); return; }
    }
    setSaving(false); toast('Marks saved.', 'success');
  };

  return (
    <div>
      <PageHeader title="Marks" subtitle="Enter and manage exam marks." icon={<FileText className="h-5 w-5" />} action={<Button onClick={save} loading={saving} disabled={!selectedExam || !selectedSubject}>Save Marks</Button>} />
      <Card className="mb-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Select label="Exam" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}><option value="">Select exam…</option>{exams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
          <Select label="Subject" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}><option value="">Select subject…</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
        </div>
      </Card>
      {loading ? <RowSkeleton /> : selectedExam && selectedSubject ? (
        <Card>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <Avatar name={s.full_name} src={s.photo_url} size="sm" />
                <div className="flex-1 min-w-0"><p className="font-medium text-ink dark:text-slate-100 truncate">{s.full_name}</p><p className="text-xs text-ink-muted">#{s.admission_number}</p></div>
                <input type="number" min={0} max={100} value={marks.get(s.id) ?? ''} onChange={(e) => setMarks((prev) => new Map(prev).set(s.id, e.target.value))} placeholder="/ 100" className="input w-24 text-center" />
              </div>
            ))}
          </div>
        </Card>
      ) : <Card><EmptyState title="Select an exam and subject" description="Choose an exam and subject to enter marks." /></Card>}
    </div>
  );
}

export function TeacherMessages() {
  return <MessageComposer />;
}

export function TeacherAnnouncements() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from('announcements').select('*').eq('school_id', profile.school_id).order('created_at', { ascending: false }).then(({ data }) => { setItems(data ?? []); setLoading(false); });
  }, [profile?.school_id]);
  return (
    <div>
      <PageHeader title="Announcements" subtitle="School announcements you can view." icon={<Megaphone className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : items.length === 0 ? <Card><EmptyState title="No announcements" /></Card> : (
        <div className="space-y-3">{items.map((a) => <Card key={a.id}><p className="font-semibold text-ink dark:text-slate-100">{a.title}</p><p className="text-sm text-ink-soft dark:text-slate-300 mt-1">{a.body}</p><p className="text-xs text-ink-muted mt-2">{relativeTime(a.created_at)}</p></Card>)}</div>
      )}
    </div>
  );
}

export function TeacherCalendar() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from('calendar_events').select('*').eq('school_id', profile.school_id).order('start_at', { ascending: true }).then(({ data }) => { setEvents(data ?? []); setLoading(false); });
  }, [profile?.school_id]);
  return (
    <div>
      <PageHeader title="Calendar" subtitle="Upcoming school events." icon={<CalendarDays className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : events.length === 0 ? <Card><EmptyState title="No events" /></Card> : (
        <Card><div className="divide-y divide-slate-100 dark:divide-slate-800">{events.map((e) => <div key={e.id} className="py-3"><p className="font-medium text-ink dark:text-slate-100">{e.title}</p><p className="text-xs text-ink-muted">{formatDate(e.start_at)}</p></div>)}</div></Card>
      )}
    </div>
  );
}

export function TeacherProfile() {
  const { profile } = useAuth();
  const { school } = useSchool();
  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your teacher profile." icon={<User className="h-5 w-5" />} />
      <div className="max-w-2xl">
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={profile?.full_name ?? ''} src={profile?.avatar_url} size="lg" />
            <div><h2 className="text-lg font-bold text-ink dark:text-slate-100">{profile?.full_name}</h2><p className="text-sm text-ink-muted">{school?.name}</p></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><p className="text-ink-muted">Role</p><p className="font-medium text-ink dark:text-slate-100">Teacher</p></div>
            <div><p className="text-ink-muted">Phone</p><p className="font-medium text-ink dark:text-slate-100">{profile?.phone ?? '—'}</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Shared components ──

function AttendanceRecorder() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { students, classes, loading } = useSchoolData();
  const [records, setRecords] = useState<Map<string, string>>(new Map());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classFilter, setClassFilter] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = classFilter ? students.filter((s) => s.class_id === classFilter) : students;

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from('attendance').select('student_id, status').eq('school_id', profile.school_id).eq('date', date).then(({ data }) => {
      const m = new Map<string, string>(); (data ?? []).forEach((r: { student_id: string; status: string }) => m.set(r.student_id, r.status)); setRecords(m);
    });
  }, [profile?.school_id, date]);

  const save = async () => {
    setSaving(true);
    const rows = Array.from(records.entries()).map(([studentId, status]) => ({ school_id: profile?.school_id, student_id: studentId, date, status, class_id: students.find((s) => s.id === studentId)?.class_id ?? null, marked_by: profile?.user_id }));
    if (rows.length) { const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' }); if (error) { setSaving(false); toast(error.message, 'error'); return; } }
    setSaving(false); toast('Attendance saved. Parents notified.', 'success');
  };

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark daily attendance for your class." icon={<CalendarCheck className="h-5 w-5" />} action={<Button onClick={save} loading={saving}>Save Attendance</Button>} />
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:max-w-[180px]" />
          <Select label="Class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="sm:max-w-[240px]"><option value="">All classes</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        </div>
      </Card>
      {loading ? <RowSkeleton /> : (
        <Card>{filtered.length === 0 ? <EmptyState title="No students" /> : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((s) => { const status = records.get(s.id) ?? 'present'; return (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <Avatar name={s.full_name} src={s.photo_url} size="sm" />
                <div className="flex-1 min-w-0"><p className="font-medium text-ink dark:text-slate-100 truncate">{s.full_name}</p><p className="text-xs text-ink-muted">#{s.admission_number}</p></div>
                <div className="flex gap-1">{(['present', 'absent', 'late', 'excused'] as const).map((st) => (
                  <button key={st} onClick={() => setRecords((prev) => new Map(prev).set(s.id, st))} className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${status === st ? 'bg-primary text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>{ATTENDANCE_LABELS[st]}</button>
                ))}</div>
              </div>); })}
          </div>
        )}</Card>
      )}
    </div>
  );
}

function MessageComposer() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { teachers, parents } = useSchoolData();
  const [recipients, setRecipients] = useState<AppUser[]>([]);
  const [form, setForm] = useState({ recipient_id: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<Message[]>([]);

  useEffect(() => {
    if (!profile?.school_id) return;
    const all = [...teachers, ...parents].filter((u) => u.user_id !== profile?.user_id);
    setRecipients(all);
    supabase.from('messages').select('*').or(`sender_id.eq.${profile.user_id},recipient_id.eq.${profile.user_id}`).order('created_at', { ascending: false }).limit(20).then(({ data }) => setConversations((data as Message[]) ?? []));
  }, [profile?.school_id, profile?.user_id, teachers, parents]);

  const send = async (e: FormEvent) => {
    e.preventDefault(); setSending(true);
    const { error } = await supabase.from('messages').insert({ school_id: profile?.school_id, sender_id: profile?.user_id, recipient_id: form.recipient_id, subject: form.subject, body: form.body });
    setSending(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Message sent.', 'success'); setForm({ recipient_id: '', subject: '', body: '' });
    const uid = profile?.user_id;
    if (!uid) return;
    supabase.from('messages').select('*').or(`sender_id.eq.${uid},recipient_id.eq.${uid}`).order('created_at', { ascending: false }).limit(20).then(({ data }) => setConversations((data as Message[]) ?? []));
  };

  const nameFor = (uid: string) => recipients.find((r) => r.user_id === uid)?.full_name ?? 'Unknown';

  return (
    <div>
      <PageHeader title="Messages" subtitle="Chat with parents and staff." icon={<MessageSquare className="h-5 w-5" />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="New Message" />
          <form onSubmit={send} className="space-y-4">
            <Select label="Recipient" required value={form.recipient_id} onChange={(e) => setForm((f) => ({ ...f, recipient_id: e.target.value }))}><option value="">Select…</option>{recipients.map((r) => <option key={r.id} value={r.user_id}>{r.full_name}</option>)}</Select>
            <Input label="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            <Textarea label="Message" required value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            <Button type="submit" loading={sending} leftIcon={<Send className="h-4 w-4" />}>Send</Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Recent Conversations" />
          {conversations.length === 0 ? <EmptyState title="No messages yet" /> : (
            <div className="space-y-3">{conversations.map((m) => (
              <div key={m.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <div className="flex items-center justify-between"><p className="text-sm font-medium text-ink dark:text-slate-100">{m.sender_id === profile?.user_id ? 'You' : nameFor(m.sender_id)}</p><p className="text-xs text-ink-muted">{relativeTime(m.created_at)}</p></div>
                {m.subject && <p className="text-xs font-medium text-ink-soft dark:text-slate-300 mt-1">{m.subject}</p>}
                <p className="text-sm text-ink-soft dark:text-slate-300 mt-1">{m.body}</p>
              </div>
            ))}</div>
          )}
        </Card>
      </div>
    </div>
  );
}
