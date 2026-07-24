import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Library, CalendarCheck, BookCopy, ClipboardList, FileText, Megaphone, CalendarDays, UserCog, BellRing, Settings as SettingsIcon, Send, X, Download, Printer } from 'lucide-react';
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
import { RowSkeleton } from '@/components/ui/Spinner';
import { formatDate, formatDateTime, relativeTime, percentage, gradeFromPercentage } from '@/lib/utils';
import { AUDIENCE_LABELS, EVENT_TYPE_LABELS, ATTENDANCE_LABELS } from '@/lib/constants';
import type { ClassRow, Subject, Student, Homework, Exam, ExamMark, ReportCard, Announcement, CalendarEvent, Notification, AppUser } from '@/types';

// ───────────────────────── Classes ─────────────────────────

export function SchoolAdminClasses() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { classes, teachers, loading, refresh } = useSchoolData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [form, setForm] = useState({ name: '', grade_level: '', stream: '', class_teacher_id: '', capacity: '40' });
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing(null); setForm({ name: '', grade_level: '', stream: '', class_teacher_id: '', capacity: '40' }); setShowForm(true); };
  const openEdit = (c: ClassRow) => { setEditing(c); setForm({ name: c.name, grade_level: c.grade_level ?? '', stream: c.stream ?? '', class_teacher_id: c.class_teacher_id ?? '', capacity: String(c.capacity) }); setShowForm(true); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { school_id: profile?.school_id, name: form.name, grade_level: form.grade_level || null, stream: form.stream || null, class_teacher_id: form.class_teacher_id || null, capacity: Number(form.capacity) };
    const { error } = editing ? await supabase.from('classes').update(payload).eq('id', editing.id) : await supabase.from('classes').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(editing ? 'Class updated.' : 'Class created.', 'success');
    setShowForm(false); refresh();
  };

  const columns: Column<ClassRow>[] = [
    { key: 'name', header: 'Class', render: (c) => <span className="font-medium text-ink dark:text-slate-100">{c.name}</span> },
    { key: 'grade', header: 'Grade', render: (c) => c.grade_level ?? '—' },
    { key: 'stream', header: 'Stream', render: (c) => c.stream ?? '—' },
    { key: 'teacher', header: 'Class Teacher', render: (c) => { const t = teachers.find((x) => x.id === c.class_teacher_id); return t?.full_name ?? '—'; } },
    { key: 'capacity', header: 'Capacity', render: (c) => c.capacity },
    { key: 'actions', header: '', render: (c) => <Button size="sm" variant="ghost" onClick={() => openEdit(c)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button> },
  ];

  return (
    <div>
      <PageHeader title="Classes" subtitle="Manage classes, streams, and assign class teachers." icon={<BookOpen className="h-5 w-5" />} action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>Add Class</Button>} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={classes} rowKey={(c) => c.id} searchKeys={['name', 'grade_level', 'stream']} searchPlaceholder="Search classes…" emptyTitle="No classes yet" /></Card>}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Class' : 'Add Class'} footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="class-form" type="submit" loading={saving}>Save</Button></>}>
        <form id="class-form" onSubmit={submit} className="space-y-4">
          <Input label="Class name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Grade 4A" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Grade level" value={form.grade_level} onChange={(e) => setForm((f) => ({ ...f, grade_level: e.target.value }))} placeholder="Grade 4" />
            <Input label="Stream" value={form.stream} onChange={(e) => setForm((f) => ({ ...f, stream: e.target.value }))} placeholder="A" />
          </div>
          <Select label="Class teacher" value={form.class_teacher_id} onChange={(e) => setForm((f) => ({ ...f, class_teacher_id: e.target.value }))}>
            <option value="">Unassigned</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
          <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
        </form>
      </Modal>
    </div>
  );
}

// ───────────────────────── Subjects ─────────────────────────

export function SchoolAdminSubjects() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { subjects, loading, refresh } = useSchoolData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { school_id: profile?.school_id, name: form.name, code: form.code || null };
    const { error } = editing ? await supabase.from('subjects').update(payload).eq('id', editing.id) : await supabase.from('subjects').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(editing ? 'Subject updated.' : 'Subject created.', 'success');
    setShowForm(false); refresh();
  };

  const columns: Column<Subject>[] = [
    { key: 'name', header: 'Subject', render: (s) => <span className="font-medium text-ink dark:text-slate-100">{s.name}</span> },
    { key: 'code', header: 'Code', render: (s) => s.code ?? '—' },
    { key: 'actions', header: '', render: (s) => <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setForm({ name: s.name, code: s.code ?? '' }); setShowForm(true); }} leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button> },
  ];

  return (
    <div>
      <PageHeader title="Subjects" subtitle="Manage the school's subject catalog." icon={<Library className="h-5 w-5" />} action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setForm({ name: '', code: '' }); setShowForm(true); }}>Add Subject</Button>} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={subjects} rowKey={(s) => s.id} searchKeys={['name', 'code']} searchPlaceholder="Search subjects…" emptyTitle="No subjects yet" /></Card>}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Subject' : 'Add Subject'} footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="subject-form" type="submit" loading={saving}>Save</Button></>}>
        <form id="subject-form" onSubmit={submit} className="space-y-4">
          <Input label="Subject name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Mathematics" />
          <Input label="Subject code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="MATH" />
        </form>
      </Modal>
    </div>
  );
}

// ───────────────────────── Attendance Overview ─────────────────────────

export function SchoolAdminAttendance() {
  const { profile } = useAuth();
  const { students, classes, loading } = useSchoolData();
  const [records, setRecords] = useState<Map<string, string>>(new Map());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classFilter, setClassFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const filtered = classFilter ? students.filter((s) => s.class_id === classFilter) : students;

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from('attendance').select('student_id, status').eq('school_id', profile.school_id).eq('date', date).then(({ data }) => {
      const m = new Map<string, string>();
      (data ?? []).forEach((r: { student_id: string; status: string }) => m.set(r.student_id, r.status));
      setRecords(m);
    });
  }, [profile?.school_id, date]);

  const setStatus = (studentId: string, status: string) => setRecords((prev) => new Map(prev).set(studentId, status));

  const save = async () => {
    setSaving(true);
    const rows = Array.from(records.entries()).map(([studentId, status]) => ({
      school_id: profile?.school_id, student_id: studentId, date, status,
      class_id: students.find((s) => s.id === studentId)?.class_id ?? null, marked_by: profile?.user_id,
    }));
    if (rows.length) {
      const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' });
      if (error) { setSaving(false); toast(error.message, 'error'); return; }
    }
    setSaving(false);
    toast('Attendance saved.', 'success');
  };

  return (
    <div>
      <PageHeader title="Attendance Overview" subtitle="View and record attendance across all classes." icon={<CalendarCheck className="h-5 w-5" />} action={<Button onClick={save} loading={saving}>Save Attendance</Button>} />
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:max-w-[180px]" />
          <Select label="Class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="sm:max-w-[240px]">
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </Card>
      {loading ? <RowSkeleton /> : (
        <Card>
          {filtered.length === 0 ? <EmptyState title="No students" description="No students match this filter." /> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => {
                const status = records.get(s.id) ?? 'present';
                return (
                  <div key={s.id} className="flex items-center gap-3 py-3">
                    <Avatar name={s.full_name} src={s.photo_url} size="sm" />
                    <div className="flex-1 min-w-0"><p className="font-medium text-ink dark:text-slate-100 truncate">{s.full_name}</p><p className="text-xs text-ink-muted">#{s.admission_number}</p></div>
                    <div className="flex gap-1">
                      {(['present', 'absent', 'late', 'excused'] as const).map((st) => (
                        <button key={st} onClick={() => setStatus(s.id, st)} className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${status === st ? 'bg-primary text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>{ATTENDANCE_LABELS[st]}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ───────────────────────── Homework Overview ─────────────────────────

export function SchoolAdminHomework() {
  const { profile } = useAuth();
  const { classes, subjects } = useSchoolData();
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from('homework').select('*').eq('school_id', profile.school_id).order('created_at', { ascending: false }).then(({ data }) => {
      setItems((data as Homework[]) ?? []); setLoading(false);
    });
  }, [profile?.school_id]);

  const columns: Column<Homework>[] = [
    { key: 'title', header: 'Title', render: (h) => <span className="font-medium text-ink dark:text-slate-100">{h.title}</span> },
    { key: 'class', header: 'Class', render: (h) => classes.find((c) => c.id === h.class_id)?.name ?? '—' },
    { key: 'subject', header: 'Subject', render: (h) => subjects.find((s) => s.id === h.subject_id)?.name ?? '—' },
    { key: 'due', header: 'Due', render: (h) => formatDate(h.due_date) },
  ];

  return (
    <div>
      <PageHeader title="Homework Overview" subtitle="All homework assigned across the school." icon={<BookCopy className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={items} rowKey={(h) => h.id} searchKeys={['title']} searchPlaceholder="Search homework…" emptyTitle="No homework yet" /></Card>}
    </div>
  );
}

// ───────────────────────── Exams ─────────────────────────

export function SchoolAdminExams() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', exam_type: 'midterm', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!profile?.school_id) return;
    setLoading(true);
    supabase.from('exams').select('*').eq('school_id', profile.school_id).order('created_at', { ascending: false }).then(({ data }) => { setExams((data as Exam[]) ?? []); setLoading(false); });
  };
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
    { key: 'end', header: 'End', render: (x) => formatDate(x.end_date) },
  ];

  return (
    <div>
      <PageHeader title="Exams" subtitle="Create and manage examinations." icon={<ClipboardList className="h-5 w-5" />} action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>Add Exam</Button>} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={exams} rowKey={(x) => x.id} searchKeys={['name']} searchPlaceholder="Search exams…" emptyTitle="No exams yet" /></Card>}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Exam" footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="exam-form" type="submit" loading={saving}>Create</Button></>}>
        <form id="exam-form" onSubmit={submit} className="space-y-4">
          <Input label="Exam name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Midterm 2025" />
          <Select label="Type" value={form.exam_type} onChange={(e) => setForm((f) => ({ ...f, exam_type: e.target.value }))}>
            <option value="midterm">Midterm</option><option value="endterm">End Term</option><option value="quiz">Quiz</option><option value="assessment">Assessment</option><option value="final">Final</option>
          </Select>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Start date" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
            <Input label="End date" type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ───────────────────────── Report Cards ─────────────────────────

export function SchoolAdminReports() {
  const { profile } = useAuth();
  const { students, classes } = useSchoolData();
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ReportCard | null>(null);

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from('report_cards').select('*').eq('school_id', profile.school_id).order('created_at', { ascending: false }).then(({ data }) => { setReports((data as ReportCard[]) ?? []); setLoading(false); });
  }, [profile?.school_id]);

  const studentName = (id: string) => students.find((s) => s.id === id)?.full_name ?? 'Unknown';

  const columns: Column<ReportCard>[] = [
    { key: 'student', header: 'Student', render: (r) => <span className="font-medium text-ink dark:text-slate-100">{studentName(r.student_id)}</span> },
    { key: 'title', header: 'Title', render: (r) => r.title },
    { key: 'grade', header: 'Grade', render: (r) => r.overall_grade ? <Badge variant="primary">{r.overall_grade}</Badge> : '—' },
    { key: 'position', header: 'Position', render: (r) => r.class_position ?? '—' },
    { key: 'status', header: 'Status', render: (r) => r.published ? <Badge variant="success">Published</Badge> : <Badge variant="warning">Draft</Badge> },
    { key: 'actions', header: '', render: (r) => <Button size="sm" variant="ghost" onClick={() => setViewing(r)}>View</Button> },
  ];

  return (
    <div>
      <PageHeader title="Report Cards" subtitle="Generate and publish digital report cards." icon={<FileText className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={reports} rowKey={(r) => r.id} searchKeys={[]} emptyTitle="No report cards yet" /></Card>}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title ?? 'Report Card'} description={viewing ? studentName(viewing.student_id) : ''} size="lg"
        footer={viewing ? <><Button variant="secondary" onClick={() => setViewing(null)}>Close</Button><Button leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print PDF</Button></> : undefined}>
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-ink-muted">Overall Grade</p><p className="font-bold text-lg text-ink dark:text-slate-100">{viewing.overall_grade ?? '—'}</p></div>
              <div><p className="text-ink-muted">Overall Marks</p><p className="font-bold text-lg text-ink dark:text-slate-100">{viewing.overall_marks ?? '—'}</p></div>
              <div><p className="text-ink-muted">Class Position</p><p className="font-bold text-lg text-ink dark:text-slate-100">{viewing.class_position ?? '—'}</p></div>
            </div>
            {viewing.summary && <div><p className="text-sm font-semibold text-ink dark:text-slate-100 mb-1">Summary</p><p className="text-sm text-ink-soft dark:text-slate-300">{viewing.summary}</p></div>}
            {viewing.teacher_remarks && <div><p className="text-sm font-semibold text-ink dark:text-slate-100 mb-1">Teacher Remarks</p><p className="text-sm text-ink-soft dark:text-slate-300">{viewing.teacher_remarks}</p></div>}
            {viewing.principal_remarks && <div><p className="text-sm font-semibold text-ink dark:text-slate-100 mb-1">Principal Remarks</p><p className="text-sm text-ink-soft dark:text-slate-300">{viewing.principal_remarks}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ───────────────────────── Announcements ─────────────────────────

export function SchoolAdminAnnouncements() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { classes } = useSchoolData();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'school', class_id: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!profile?.school_id) return;
    setLoading(true);
    supabase.from('announcements').select('*').eq('school_id', profile.school_id).order('created_at', { ascending: false }).then(({ data }) => { setItems((data as Announcement[]) ?? []); setLoading(false); });
  };
  useEffect(load, [profile?.school_id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('announcements').insert({
      school_id: profile?.school_id, author_id: profile?.user_id, title: form.title, body: form.body,
      audience: form.audience, class_id: form.audience === 'class' ? form.class_id || null : null, published_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Announcement published.', 'success'); setShowForm(false); setForm({ title: '', body: '', audience: 'school', class_id: '' }); load();
  };

  const columns: Column<Announcement>[] = [
    { key: 'title', header: 'Title', render: (a) => <span className="font-medium text-ink dark:text-slate-100">{a.title}</span> },
    { key: 'audience', header: 'Audience', render: (a) => <Badge variant={a.audience === 'emergency' ? 'error' : a.audience === 'school' ? 'primary' : 'neutral'}>{AUDIENCE_LABELS[a.audience]}</Badge> },
    { key: 'date', header: 'Published', render: (a) => <span className="text-xs text-ink-muted">{relativeTime(a.published_at ?? a.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Publish school-wide, class, or emergency announcements." icon={<Megaphone className="h-5 w-5" />} action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>New Announcement</Button>} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={items} rowKey={(a) => a.id} searchKeys={['title']} searchPlaceholder="Search announcements…" emptyTitle="No announcements yet" /></Card>}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Announcement" footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="ann-form" type="submit" loading={saving}>Publish</Button></>}>
        <form id="ann-form" onSubmit={submit} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="Message" required value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <Select label="Audience" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}>
            {Object.entries(AUDIENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          {form.audience === 'class' && (
            <Select label="Class" value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}>
              <option value="">Select class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </form>
      </Modal>
    </div>
  );
}

// ───────────────────────── Calendar ─────────────────────────

export function SchoolAdminCalendar() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_type: 'event', start_at: '', end_at: '', location: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!profile?.school_id) return;
    setLoading(true);
    supabase.from('calendar_events').select('*').eq('school_id', profile.school_id).order('start_at', { ascending: true }).then(({ data }) => { setEvents((data as CalendarEvent[]) ?? []); setLoading(false); });
  };
  useEffect(load, [profile?.school_id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('calendar_events').insert({
      school_id: profile?.school_id, title: form.title, description: form.description, event_type: form.event_type,
      start_at: new Date(form.start_at).toISOString(), end_at: form.end_at ? new Date(form.end_at).toISOString() : null, location: form.location || null, created_by: profile?.user_id,
    });
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Event created.', 'success'); setShowForm(false); setForm({ title: '', description: '', event_type: 'event', start_at: '', end_at: '', location: '' }); load();
  };

  return (
    <div>
      <PageHeader title="School Calendar" subtitle="Events, exams, meetings, and holidays." icon={<CalendarDays className="h-5 w-5" />} action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>Add Event</Button>} />
      {loading ? <RowSkeleton /> : (
        <Card>
          {events.length === 0 ? <EmptyState title="No events" description="Add school events, exams, and holidays." /> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-light">
                    <span className="text-xs font-medium leading-none">{new Date(ev.start_at).toLocaleString(undefined, { month: 'short' })}</span>
                    <span className="text-lg font-bold leading-none">{new Date(ev.start_at).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink dark:text-slate-100 truncate">{ev.title}</p>
                    <p className="text-xs text-ink-muted">{EVENT_TYPE_LABELS[ev.event_type]} · {formatDateTime(ev.start_at)}{ev.location ? ` · ${ev.location}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Event" footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="ev-form" type="submit" loading={saving}>Create</Button></>}>
        <form id="ev-form" onSubmit={submit} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Select label="Type" value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Start" type="datetime-local" required value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} />
            <Input label="End" type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} />
          </div>
          <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
        </form>
      </Modal>
    </div>
  );
}

// ───────────────────────── User Management ─────────────────────────

export function SchoolAdminUsers() {
  const { profile } = useAuth();
  const { teachers, parents, loading, refresh } = useSchoolData();
  const { toast } = useToast();
  const all = [...teachers, ...parents];

  const toggle = async (u: AppUser) => {
    const { error } = await supabase.from('app_users').update({ active: !u.active }).eq('id', u.id);
    if (error) { toast(error.message, 'error'); return; }
    toast(u.active ? 'Account disabled.' : 'Account enabled.', 'success'); refresh();
  };

  const columns: Column<AppUser>[] = [
    { key: 'name', header: 'Name', render: (u) => <div className="flex items-center gap-3"><Avatar name={u.full_name} src={u.avatar_url} size="sm" /><span className="font-medium text-ink dark:text-slate-100">{u.full_name}</span></div> },
    { key: 'role', header: 'Role', render: (u) => <Badge variant="neutral" className="capitalize">{u.role.replace('_', ' ')}</Badge> },
    { key: 'phone', header: 'Phone', render: (u) => u.phone ?? '—' },
    { key: 'status', header: 'Status', render: (u) => u.active ? <Badge variant="success">Active</Badge> : <Badge variant="error">Disabled</Badge> },
    { key: 'actions', header: '', render: (u) => <Button size="sm" variant={u.active ? 'danger' : 'secondary'} onClick={() => toggle(u)}>{u.active ? 'Disable' : 'Enable'}</Button> },
  ];

  return (
    <div>
      <PageHeader title="User Management" subtitle="Enable or disable staff and parent accounts." icon={<UserCog className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : <Card><DataTable columns={columns} data={all} rowKey={(u) => u.id} searchKeys={['full_name', 'phone']} searchPlaceholder="Search users…" emptyTitle="No users" /></Card>}
    </div>
  );
}

// ───────────────────────── Notifications ─────────────────────────

export function SchoolAdminNotifications() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.user_id) return;
    supabase.from('notifications').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).then(({ data }) => { setItems((data as Notification[]) ?? []); setLoading(false); });
  }, [profile?.user_id]);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Your recent notifications." icon={<BellRing className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : (
        <Card>
          {items.length === 0 ? <EmptyState title="No notifications" /> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((n) => (
                <div key={n.id} className={`flex items-start gap-3 py-3 ${n.read_at ? '' : 'bg-primary-50/50 dark:bg-primary-500/5'}`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"><BellRing className="h-4 w-4 text-ink-muted" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink dark:text-slate-100">{n.title}</p>{n.body && <p className="text-xs text-ink-muted">{n.body}</p>}<p className="text-xs text-ink-muted mt-0.5">{relativeTime(n.created_at)}</p></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ───────────────────────── Settings ─────────────────────────

export function SchoolAdminSettings() {
  const { school } = useSchool();
  return (
    <div>
      <PageHeader title="School Settings" subtitle="View and update your school's profile." icon={<SettingsIcon className="h-5 w-5" />} />
      <div className="max-w-2xl space-y-4">
        <Card><CardHeader title="School Name" /><p className="text-sm text-ink-soft dark:text-slate-300">{school?.name ?? '—'}</p></Card>
        <Card><CardHeader title="Contact" /><div className="text-sm text-ink-soft dark:text-slate-300 space-y-1"><p>{school?.email ?? '—'}</p><p>{school?.phone ?? '—'}</p><p>{school?.address ?? '—'}</p></div></Card>
        <Card><CardHeader title="Principal" /><p className="text-sm text-ink-soft dark:text-slate-300">{school?.principal_name ?? '—'}</p></Card>
      </div>
    </div>
  );
}
