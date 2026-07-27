import { useEffect, useState, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, GraduationCap, CalendarCheck, BookCopy, ClipboardList, FileText, MessageSquare, Megaphone, CalendarDays, User, Plus, Send, Download, Search, Paperclip, Smile, Check, CheckCheck, Clock, X, ChevronRight, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSchool } from '@/hooks/useSchool';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useAcademic } from '@/context/AcademicContext';
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
import { formatDate, relativeTime, percentage, gradeFromPercentage, cn } from '@/lib/utils';
import { ATTENDANCE_LABELS } from '@/lib/constants';
import type { Student, Homework, Exam, ExamMark, ExamSession, ClassRow, Subject, Message, AppUser, ClassSubject } from '@/types';

// ─── Teacher Dashboard ──────────────────────────────────────────────────────

export function TeacherDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { classes, students, classSubjects } = useSchoolData();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ classes: 0, students: 0, homework: 0, exams: 0 });

  useEffect(() => {
    if (!profile?.school_id) return;
    (async () => {
      const myClassIds = classes.filter((c) => c.class_teacher_id === profile?.id).map((c) => c.id);
      const myStudentIds = students.filter((s) => s.class_id && myClassIds.includes(s.class_id)).map((s) => s.id);
      const [hw, ex] = await Promise.all([
        supabase.from('homework').select('id', { count: 'exact', head: true }).eq('school_id', profile.school_id).eq('teacher_id', profile.user_id),
        supabase.from('exams').select('id', { count: 'exact', head: true }).eq('school_id', profile.school_id).eq('teacher_id', profile.user_id),
      ]);
      setCounts({ classes: myClassIds.length, students: myStudentIds.length, homework: hw.count ?? 0, exams: ex.count ?? 0 });
      setLoading(false);
    })();
  }, [profile, classes, students]);

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name.split(' ')[0] ?? ''}`} subtitle={school?.name ?? 'Teacher portal'} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My Classes" value={counts.classes} icon={<BookOpen className="h-5 w-5" />} />
          <StatCard label="My Students" value={counts.students} icon={<GraduationCap className="h-5 w-5" />} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
          <StatCard label="Homework" value={counts.homework} icon={<BookCopy className="h-5 w-5" />} accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
          <StatCard label="Exams" value={counts.exams} icon={<ClipboardList className="h-5 w-5" />} accent="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" />
        </div>
      )}
    </div>
  );
}

// ─── Teacher Classes ─────────────────────────────────────────────────────────

export function TeacherClasses() {
  const { profile } = useAuth();
  const { classes, classSubjects, subjects, loading } = useSchoolData();
  const myClasses = classes.filter((c) => c.class_teacher_id === profile?.id);

  return (
    <div>
      <PageHeader title="My Classes" subtitle="Classes you are assigned to as class teacher." icon={<BookOpen className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : myClasses.length === 0 ? <Card><EmptyState title="No classes assigned" description="Your school admin will assign classes to you." /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myClasses.map((c) => {
            const subs = classSubjects.filter((cs) => cs.class_id === c.id).map((cs) => subjects.find((s) => s.id === cs.subject_id)).filter(Boolean);
            return (
              <Card key={c.id} hover>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-light"><BookOpen className="h-5 w-5" /></div>
                  <Badge variant="primary">{c.capacity} seats</Badge>
                </div>
                <h3 className="font-semibold text-ink dark:text-slate-100">{c.name}</h3>
                <p className="text-sm text-ink-muted mt-1">{c.grade_level ?? '—'} · Stream {c.stream ?? '—'}</p>
                {subs.length > 0 && <p className="text-xs text-ink-muted mt-2">Subjects: {subs.map((s) => s!.name).join(', ')}</p>}
                <div className="mt-4 flex gap-2">
                  <Link to="/teacher/students"><Button size="sm" variant="secondary">View Students</Button></Link>
                  <Link to="/teacher/attendance"><Button size="sm" variant="ghost">Attendance</Button></Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Teacher Students (scoped to selected class) ─────────────────────────────

export function TeacherStudents() {
  const { profile } = useAuth();
  const { students, classes, parents, classSubjects, subjects, loading } = useSchoolData();
  const { years, terms, selectedYearId, selectedTermId, setYear, setTerm } = useAcademic();
  const [classId, setClassId] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Student | null>(null);

  const myClasses = classes.filter((c) => c.class_teacher_id === profile?.id || classSubjects.some((cs) => cs.class_id === c.id && cs.teacher_id === profile?.id));
  const classStudents = classId ? students.filter((s) => s.class_id === classId) : [];
  const filtered = search.trim()
    ? classStudents.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.admission_number.toLowerCase().includes(search.toLowerCase()))
    : classStudents;

  const parentFor = (studentId: string) => {
    // Find via student_parents — we don't have it loaded, so we'll look up when viewing
    return null;
  };

  return (
    <div>
      <PageHeader title="Students" subtitle="Select a class to view enrolled students." icon={<GraduationCap className="h-5 w-5" />} />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Academic Year" value={selectedYearId} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select…</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </Select>
          <Select label="Term" value={selectedTermId} onChange={(e) => setTerm(e.target.value)}>
            <option value="">Select…</option>
            {terms.filter((t) => !selectedYearId || t.academic_year_id === selectedYearId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select class…</option>
            {myClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or admission #" leftIcon={<Search className="h-4 w-4" />} />
        </div>
      </Card>
      {loading ? <RowSkeleton /> : !classId ? <Card><EmptyState title="Select a class" description="Choose a class to view enrolled students." /></Card> : filtered.length === 0 ? <Card><EmptyState title="No students found" /></Card> : (
        <Card>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <Avatar name={s.full_name} src={s.photo_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink dark:text-slate-100 truncate">{s.full_name}</p>
                  <p className="text-xs text-ink-muted">#{s.admission_number} · <span className="capitalize">{s.gender ?? '—'}</span></p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setViewing(s)}>View Profile</Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      {viewing && <StudentProfileModal student={viewing} classId={classId} onClose={() => setViewing(null)} />}
    </div>
  );
}

function StudentProfileModal({ student, classId, onClose }: { student: Student; classId: string; onClose: () => void }) {
  const [parents, setParents] = useState<AppUser[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<ExamMark[]>([]);
  const { subjects } = useSchoolData();

  useEffect(() => {
    supabase.from('student_parents').select('parent_user_id').eq('student_id', student.id).then(({ data }) => {
      const ids = (data ?? []).map((r: { parent_user_id: string }) => r.parent_user_id);
      if (ids.length) supabase.from('app_users').select('*').in('user_id', ids).then(({ data }) => setParents((data as AppUser[]) ?? []));
    });
    supabase.from('attendance').select('*').eq('student_id', student.id).order('date', { ascending: false }).limit(10).then(({ data }) => setAttendance(data ?? []));
    supabase.from('exam_marks').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(10).then(({ data }) => setMarks((data as ExamMark[]) ?? []));
  }, [student.id]);

  return (
    <Modal open={!!student} onClose={onClose} title={student.full_name} description={`Admission #${student.admission_number}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar name={student.full_name} src={student.photo_url} size="lg" />
          <div className="text-sm">
            <p className="text-ink-muted">Gender: <span className="capitalize">{student.gender ?? '—'}</span></p>
            <p className="text-ink-muted">DOB: {student.date_of_birth ? formatDate(student.date_of_birth) : '—'}</p>
            {student.medical_notes && <p className="text-warning-dark">Medical: {student.medical_notes}</p>}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink dark:text-slate-100 mb-2">Parents</p>
          {parents.length === 0 ? <p className="text-sm text-ink-muted">No parents linked.</p> : (
            <div className="space-y-2">{parents.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2">
                <Avatar name={p.full_name} size="sm" />
                <span className="text-sm font-medium text-ink dark:text-slate-100">{p.full_name}</span>
              </div>
            ))}</div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink dark:text-slate-100 mb-2">Recent Attendance</p>
          {attendance.length === 0 ? <p className="text-sm text-ink-muted">No records.</p> : (
            <div className="space-y-1">{attendance.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft dark:text-slate-300">{formatDate(a.date)} · <span className="capitalize">{a.session}</span></span>
                <Badge variant={statusBadge(a.status).variant}>{statusBadge(a.status).label}</Badge>
              </div>
            ))}</div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink dark:text-slate-100 mb-2">Recent Marks</p>
          {marks.length === 0 ? <p className="text-sm text-ink-muted">No marks recorded.</p> : (
            <div className="space-y-1">{marks.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft dark:text-slate-300">{subjects.find((s) => s.id === m.subject_id)?.name ?? '—'}</span>
                <span className="font-medium text-ink dark:text-slate-100">{m.marks}/{m.total_marks} · {m.grade ?? '—'}</span>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Teacher Attendance (morning/afternoon sessions) ──────────────────────────

export function TeacherAttendance() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { students, classes, classSubjects, loading } = useSchoolData();
  const { years, terms, selectedYearId, selectedTermId, setYear, setTerm } = useAcademic();
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [session, setSession] = useState<'morning' | 'afternoon'>('morning');
  const [records, setRecords] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);

  const myClasses = classes.filter((c) => c.class_teacher_id === profile?.id || classSubjects.some((cs) => cs.class_id === c.id && cs.teacher_id === profile?.id));
  const classStudents = classId ? students.filter((s) => s.class_id === classId) : [];

  useEffect(() => {
    if (!classId || !date) { setRecords(new Map()); return; }
    supabase.from('attendance').select('student_id, status').eq('class_id', classId).eq('date', date).eq('session', session).then(({ data }) => {
      const m = new Map<string, string>();
      (data ?? []).forEach((r: { student_id: string; status: string }) => m.set(r.student_id, r.status));
      setRecords(m);
    });
  }, [classId, date, session]);

  const save = async () => {
    if (!classId || !profile?.school_id) return;
    setSaving(true);
    const rows = classStudents.map((s) => ({
      school_id: profile.school_id, student_id: s.id, class_id: classId, date, session, status: records.get(s.id) ?? 'present', marked_by: profile.user_id,
    }));
    if (rows.length) {
      const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date,session' });
      if (error) { setSaving(false); toast(error.message, 'error'); return; }
    }
    setSaving(false); toast(`${session === 'morning' ? 'Morning' : 'Afternoon'} attendance saved.`, 'success');
  };

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark morning and afternoon attendance." icon={<CalendarCheck className="h-5 w-5" />} action={<Button onClick={save} loading={saving} disabled={!classId}>Save Attendance</Button>} />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select label="Academic Year" value={selectedYearId} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select…</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </Select>
          <Select label="Term" value={selectedTermId} onChange={(e) => setTerm(e.target.value)}>
            <option value="">Select…</option>
            {terms.filter((t) => !selectedYearId || t.academic_year_id === selectedYearId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select class…</option>
            {myClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="Session" value={session} onChange={(e) => setSession(e.target.value as 'morning' | 'afternoon')}>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </Select>
        </div>
      </Card>
      {loading ? <RowSkeleton /> : !classId ? <Card><EmptyState title="Select a class" /></Card> : classStudents.length === 0 ? <Card><EmptyState title="No students in this class" /></Card> : (
        <Card>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {classStudents.map((s) => { const status = records.get(s.id) ?? 'present'; return (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <Avatar name={s.full_name} src={s.photo_url} size="sm" />
                <div className="flex-1 min-w-0"><p className="font-medium text-ink dark:text-slate-100 truncate">{s.full_name}</p><p className="text-xs text-ink-muted">#{s.admission_number}</p></div>
                <div className="flex gap-1">{(['present', 'absent', 'late', 'excused'] as const).map((st) => (
                  <button key={st} onClick={() => setRecords((prev) => new Map(prev).set(s.id, st))} className={cn('rounded-lg px-2.5 py-1 text-xs font-medium transition-colors', status === st ? 'bg-primary text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300')}>{ATTENDANCE_LABELS[st]}</button>
                ))}</div>
              </div>); })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Teacher Homework ─────────────────────────────────────────────────────────

export function TeacherHomework() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { classes, subjects, classSubjects } = useSchoolData();
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', class_id: '', subject_id: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  const myClasses = classes.filter((c) => c.class_teacher_id === profile?.id || classSubjects.some((cs) => cs.class_id === c.id && cs.teacher_id === profile?.id));

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
            <Select label="Class" required value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}><option value="">Select…</option>{myClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Select label="Subject" value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}><option value="">Select…</option>{subjects.filter((s) => !form.class_id || classSubjects.some((cs) => cs.class_id === form.class_id && cs.subject_id === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          </div>
          <Input label="Due date" type="date" required value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
        </form>
      </Modal>
    </div>
  );
}

// ─── Teacher Exams (Exam Sessions + Schedules) ───────────────────────────────

export function TeacherExams() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { classes, subjects, classSubjects, examSessions, refresh } = useSchoolData();
  const { years, terms, selectedYearId, selectedTermId, setYear, setTerm } = useAcademic();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'sessions' | 'schedule'>('sessions');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingSession, setEditingSession] = useState<ExamSession | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [viewingSession, setViewingSession] = useState<ExamSession | null>(null);
  const [sessionForm, setSessionForm] = useState({ name: '', start_date: '', end_date: '', status: 'scheduled' as const });
  const [examForm, setExamForm] = useState({ exam_session_id: '', class_id: '', subject_id: '', exam_date: '', start_time: '', end_time: '', duration_minutes: '', room: '', total_marks: '100' });
  const [saving, setSaving] = useState(false);

  const myClasses = classes.filter((c) => c.class_teacher_id === profile?.id || classSubjects.some((cs) => cs.class_id === c.id && cs.teacher_id === profile?.id));

  const loadExams = () => {
    if (!profile?.school_id) return;
    setLoading(true);
    supabase.from('exams').select('*').eq('school_id', profile.school_id).order('exam_date', { ascending: true }).then(({ data }) => { setExams((data as Exam[]) ?? []); setLoading(false); });
  };
  useEffect(loadExams, [profile?.school_id]);

  const openNewSession = () => { setEditingSession(null); setSessionForm({ name: '', start_date: '', end_date: '', status: 'scheduled' }); setShowSessionForm(true); };
  const openEditSession = (es: ExamSession) => { setEditingSession(es); setSessionForm({ name: es.name, start_date: es.start_date ?? '', end_date: es.end_date ?? '', status: es.status as 'scheduled' }); setShowSessionForm(true); };

  const saveSession = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (editingSession) {
      const { error } = await supabase.from('exam_sessions').update({
        name: sessionForm.name, start_date: sessionForm.start_date || null, end_date: sessionForm.end_date || null, status: sessionForm.status,
      }).eq('id', editingSession.id);
      setSaving(false);
      if (error) { toast(error.message, 'error'); return; }
      toast('Exam session updated.', 'success');
    } else {
      const { error } = await supabase.from('exam_sessions').insert({
        school_id: profile?.school_id, academic_year_id: selectedYearId || null, term_id: selectedTermId || null,
        name: sessionForm.name, start_date: sessionForm.start_date || null, end_date: sessionForm.end_date || null, status: sessionForm.status,
      });
      setSaving(false);
      if (error) { toast(error.message, 'error'); return; }
      toast('Exam session created.', 'success');
    }
    setShowSessionForm(false); refresh();
  };

  const deleteSession = async (es: ExamSession) => {
    if (!confirm(`Delete "${es.name}"? This also deletes all exams inside it.`)) return;
    const { error } = await supabase.from('exam_sessions').delete().eq('id', es.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Session deleted.', 'success'); refresh(); loadExams();
  };

  const openNewExam = () => { setEditingExam(null); setExamForm({ exam_session_id: '', class_id: '', subject_id: '', exam_date: '', start_time: '', end_time: '', duration_minutes: '', room: '', total_marks: '100' }); setShowExamForm(true); };
  const openEditExam = (ex: Exam) => {
    setEditingExam(ex);
    setExamForm({ exam_session_id: ex.exam_session_id ?? '', class_id: ex.class_id ?? '', subject_id: ex.subject_id ?? '', exam_date: ex.exam_date ?? '', start_time: ex.start_time ?? '', end_time: ex.end_time ?? '', duration_minutes: ex.duration_minutes ? String(ex.duration_minutes) : '', room: ex.room ?? '', total_marks: String(ex.total_marks) });
    setShowExamForm(true);
  };

  const saveExam = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    const subj = subjects.find((s) => s.id === examForm.subject_id);
    const payload = {
      school_id: profile?.school_id, exam_session_id: examForm.exam_session_id, term_id: selectedTermId || null,
      name: `${subj?.name ?? 'Exam'}`, exam_type: 'midterm',
      class_id: examForm.class_id, subject_id: examForm.subject_id,
      exam_date: examForm.exam_date, start_time: examForm.start_time || null, end_time: examForm.end_time || null,
      duration_minutes: examForm.duration_minutes ? Number(examForm.duration_minutes) : null, room: examForm.room || null,
      teacher_id: profile?.user_id, total_marks: Number(examForm.total_marks) || 100, status: 'scheduled' as const,
    };
    if (editingExam) {
      const { error } = await supabase.from('exams').update(payload).eq('id', editingExam.id);
      setSaving(false);
      if (error) { toast(error.message, 'error'); return; }
      toast('Exam updated.', 'success');
    } else {
      const { error } = await supabase.from('exams').insert(payload);
      setSaving(false);
      if (error) { toast(error.message, 'error'); return; }
      toast('Exam scheduled.', 'success');
    }
    setShowExamForm(false); loadExams();
  };

  const deleteExam = async (ex: Exam) => {
    if (!confirm('Delete this scheduled exam?')) return;
    const { error } = await supabase.from('exams').delete().eq('id', ex.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Exam deleted.', 'success'); loadExams();
  };

  const sessionStatusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      scheduled: { variant: 'primary', label: 'Scheduled' },
      completed: { variant: 'primary', label: 'Completed' },
      published: { variant: 'success', label: 'Published' },
    };
    return map[status] ?? map.draft;
  };

  const viewingSessionExams = viewingSession ? exams.filter((e) => e.exam_session_id === viewingSession.id) : [];

  return (
    <div>
      <PageHeader title="Exams" subtitle="Create exam sessions and schedule exams." icon={<ClipboardList className="h-5 w-5" />} action={tab === 'sessions'
        ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNewSession}>New Session</Button>
        : <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNewExam}>Schedule Exam</Button>
      } />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Academic Year" value={selectedYearId} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select…</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </Select>
          <Select label="Term" value={selectedTermId} onChange={(e) => setTerm(e.target.value)}>
            <option value="">Select…</option>
            {terms.filter((t) => !selectedYearId || t.academic_year_id === selectedYearId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
      </Card>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('sessions')} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === 'sessions' ? 'bg-primary text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300')}>Exam Sessions</button>
        <button onClick={() => setTab('schedule')} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === 'schedule' ? 'bg-primary text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300')}>Exam Schedule</button>
      </div>

      {tab === 'sessions' ? (
        loading ? <RowSkeleton /> : examSessions.length === 0 ? <Card><EmptyState title="No exam sessions" description="Create an exam session to get started." /></Card> : (
          <div className="space-y-3">{examSessions.map((es) => {
            const sb = sessionStatusBadge(es.status);
            const sessionExams = exams.filter((e) => e.exam_session_id === es.id);
            return (
              <Card key={es.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink dark:text-slate-100">{es.name}</h3>
                    <p className="text-sm text-ink-muted mt-1">{es.start_date ? formatDate(es.start_date) : '—'} → {es.end_date ? formatDate(es.end_date) : '—'}</p>
                    <p className="text-xs text-ink-muted mt-1">{sessionExams.length} exam(s) scheduled</p>
                  </div>
                  <Badge variant={sb.variant}>{sb.label}</Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="secondary" onClick={() => setViewingSession(es)}>View Details</Button>
                  <Button size="sm" variant="ghost" onClick={() => openEditSession(es)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => deleteSession(es)}>Delete</Button>
                </div>
              </Card>
            );
          })}</div>
        )
      ) : (
        loading ? <RowSkeleton /> : exams.length === 0 ? <Card><EmptyState title="No exams scheduled" description="Schedule exams within an exam session." /></Card> : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-ink-muted border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Class</th><th className="py-2 pr-3">Subject</th><th className="py-2 pr-3">Time</th><th className="py-2 pr-3">Room</th><th className="py-2 pr-3">Total</th><th className="py-2 pr-3"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {exams.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2 pr-3 text-ink dark:text-slate-100">{e.exam_date ? formatDate(e.exam_date) : '—'}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{classes.find((c) => c.id === e.class_id)?.name ?? '—'}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{subjects.find((s) => s.id === e.subject_id)?.name ?? '—'}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{e.start_time ? `${e.start_time.slice(0, 5)} - ${e.end_time?.slice(0, 5) ?? ''}` : '—'}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{e.room ?? '—'}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{e.total_marks}</td>
                      <td className="py-2 pr-3"><div className="flex gap-1"><button onClick={() => openEditExam(e)} className="text-xs text-primary-600 hover:underline">Edit</button><button onClick={() => deleteExam(e)} className="text-xs text-rose-600 hover:underline">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* Session detail modal */}
      <Modal open={!!viewingSession} onClose={() => setViewingSession(null)} title={viewingSession?.name ?? 'Session'} description={viewingSession ? `${viewingSession.start_date ? formatDate(viewingSession.start_date) : '—'} → ${viewingSession.end_date ? formatDate(viewingSession.end_date) : '—'}` : ''} size="lg">
        {viewingSession && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={sessionStatusBadge(viewingSession.status).variant}>{sessionStatusBadge(viewingSession.status).label}</Badge>
              <span className="text-sm text-ink-muted">{viewingSessionExams.length} exam(s)</span>
            </div>
            {viewingSessionExams.length === 0 ? <EmptyState title="No exams in this session yet" /> : (
              <div className="space-y-2">{viewingSessionExams.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-slate-100">{subjects.find((s) => s.id === e.subject_id)?.name ?? '—'}</p>
                    <p className="text-xs text-ink-muted">{classes.find((c) => c.id === e.class_id)?.name ?? '—'} · {e.exam_date ? formatDate(e.exam_date) : '—'} · {e.start_time ? `${e.start_time.slice(0, 5)}` : ''} · {e.total_marks} marks</p>
                  </div>
                  <Badge variant="primary">{e.room ?? '—'}</Badge>
                </div>
              ))}</div>
            )}
          </div>
        )}
      </Modal>

      {/* Session form modal */}
      <Modal open={showSessionForm} onClose={() => setShowSessionForm(false)} title={editingSession ? 'Edit Exam Session' : 'New Exam Session'} footer={<><Button variant="secondary" onClick={() => setShowSessionForm(false)}>Cancel</Button><Button form="session-form" type="submit" loading={saving}>{editingSession ? 'Save' : 'Create'}</Button></>}>
        <form id="session-form" onSubmit={saveSession} className="space-y-4">
          <Input label="Session Name" required placeholder="e.g. Midterm Term 1" value={sessionForm.name} onChange={(e) => setSessionForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={sessionForm.start_date} onChange={(e) => setSessionForm((f) => ({ ...f, start_date: e.target.value }))} />
            <Input label="End Date" type="date" value={sessionForm.end_date} onChange={(e) => setSessionForm((f) => ({ ...f, end_date: e.target.value }))} />
          </div>
          <Select label="Status" value={sessionForm.status} onChange={(e) => setSessionForm((f) => ({ ...f, status: e.target.value as any }))}>
            <option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="published">Published</option>
          </Select>
        </form>
      </Modal>

      {/* Exam form modal */}
      <Modal open={showExamForm} onClose={() => setShowExamForm(false)} title={editingExam ? 'Edit Exam' : 'Schedule Exam'} size="lg" footer={<><Button variant="secondary" onClick={() => setShowExamForm(false)}>Cancel</Button><Button form="exam-form" type="submit" loading={saving}>{editingExam ? 'Save' : 'Schedule'}</Button></>}>
        <form id="exam-form" onSubmit={saveExam} className="space-y-4">
          <Select label="Exam Session" required value={examForm.exam_session_id} onChange={(e) => setExamForm((f) => ({ ...f, exam_session_id: e.target.value }))}>
            <option value="">Select…</option>
            {examSessions.map((es) => <option key={es.id} value={es.id}>{es.name}</option>)}
          </Select>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Class" required value={examForm.class_id} onChange={(e) => setExamForm((f) => ({ ...f, class_id: e.target.value, subject_id: '' }))}>
              <option value="">Select…</option>
              {myClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Subject" required value={examForm.subject_id} onChange={(e) => setExamForm((f) => ({ ...f, subject_id: e.target.value }))}>
              <option value="">Select…</option>
              {subjects.filter((s) => !examForm.class_id || classSubjects.some((cs) => cs.class_id === examForm.class_id && cs.subject_id === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Exam Date" type="date" required value={examForm.exam_date} onChange={(e) => setExamForm((f) => ({ ...f, exam_date: e.target.value }))} />
            <Input label="Start Time" type="time" value={examForm.start_time} onChange={(e) => setExamForm((f) => ({ ...f, start_time: e.target.value }))} />
            <Input label="End Time" type="time" value={examForm.end_time} onChange={(e) => setExamForm((f) => ({ ...f, end_time: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Duration (min)" type="number" value={examForm.duration_minutes} onChange={(e) => setExamForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
            <Input label="Room" value={examForm.room} onChange={(e) => setExamForm((f) => ({ ...f, room: e.target.value }))} />
            <Input label="Total Marks" type="number" required value={examForm.total_marks} onChange={(e) => setExamForm((f) => ({ ...f, total_marks: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Teacher Marks ────────────────────────────────────────────────────────────

export function TeacherMarks() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { students, subjects, classes, classSubjects, examSessions } = useSchoolData();
  const { years, terms, selectedYearId, selectedTermId, setYear, setTerm } = useAcademic();
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examId, setExamId] = useState('');
  const [marks, setMarks] = useState<Map<string, string>>(new Map());
  const [remarks, setRemarks] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const myClasses = classes.filter((c) => c.class_teacher_id === profile?.id || classSubjects.some((cs) => cs.class_id === c.id && cs.teacher_id === profile?.id));

  const sessionExams = exams.filter((e) => !sessionId || e.exam_session_id === sessionId);
  const filteredExams = sessionExams.filter((e) => (!classId || e.class_id === classId) && (!subjectId || e.subject_id === subjectId));
  const selectedExam = exams.find((e) => e.id === examId);
  const classStudents = classId ? students.filter((s) => s.class_id === classId) : [];

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from('exams').select('*').eq('school_id', profile.school_id).order('exam_date', { ascending: true }).then(({ data }) => setExams((data as Exam[]) ?? []));
  }, [profile?.school_id]);

  useEffect(() => {
    if (!examId) { setMarks(new Map()); setRemarks(new Map()); return; }
    supabase.from('exam_marks').select('student_id, marks, teacher_comment').eq('exam_id', examId).then(({ data }) => {
      const m = new Map<string, string>(); const r = new Map<string, string>();
      (data ?? []).forEach((row: { student_id: string; marks: string | number | null; teacher_comment: string | null }) => {
        m.set(row.student_id, row.marks !== null ? String(row.marks) : '');
        r.set(row.student_id, row.teacher_comment ?? '');
      });
      setMarks(m); setRemarks(r);
    });
  }, [examId]);

  const totalMarks = selectedExam?.total_marks ?? 100;

  const setMark = (studentId: string, value: string) => {
    if (value && Number(value) > totalMarks) { toast(`Marks cannot exceed ${totalMarks}`, 'error'); return; }
    setMarks((prev) => new Map(prev).set(studentId, value));
  };

  const save = async () => {
    if (!examId || !profile?.school_id) return;
    setSaving(true);
    const rows = Array.from(marks.entries()).filter(([, v]) => v !== '').map(([studentId, val]) => {
      const pct = percentage(Number(val), totalMarks) ?? 0;
      return {
        school_id: profile.school_id, exam_id: examId, student_id: studentId, subject_id: selectedExam?.subject_id, class_id: classId,
        marks: Number(val), total_marks: totalMarks, grade: gradeFromPercentage(pct), teacher_comment: remarks.get(studentId) ?? null, entered_by: profile.user_id,
      };
    });
    if (rows.length) {
      const { error } = await supabase.from('exam_marks').upsert(rows, { onConflict: 'exam_id,student_id,subject_id' });
      if (error) { setSaving(false); toast(error.message, 'error'); return; }
    }
    setSaving(false); toast('Marks saved.', 'success');
  };

  const stats = (() => {
    const vals = Array.from(marks.values()).filter((v) => v !== '').map(Number);
    if (vals.length === 0) return null;
    const highest = Math.max(...vals);
    const lowest = Math.min(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const passCount = vals.filter((v) => percentage(v, totalMarks) ?? 0 >= 50).length;
    const passPct = (passCount / vals.length) * 100;
    const dist: Record<string, number> = {};
    vals.forEach((v) => { const g = gradeFromPercentage(percentage(v, totalMarks) ?? 0); dist[g] = (dist[g] ?? 0) + 1; });
    return { highest, lowest, avg, passPct, dist };
  })();

  return (
    <div>
      <PageHeader title="Marks" subtitle="Enter exam marks for your class." icon={<FileText className="h-5 w-5" />} action={<div className="flex gap-2">
        <Button variant="secondary" onClick={() => setShowResults(true)} disabled={!stats}>View Results</Button>
        <Button onClick={save} loading={saving} disabled={!examId}>Save Marks</Button>
      </div>} />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Select label="Year" value={selectedYearId} onChange={(e) => setYear(e.target.value)}><option value="">Select…</option>{years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</Select>
          <Select label="Term" value={selectedTermId} onChange={(e) => setTerm(e.target.value)}><option value="">Select…</option>{terms.filter((t) => !selectedYearId || t.academic_year_id === selectedYearId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
          <Select label="Exam Session" value={sessionId} onChange={(e) => setSessionId(e.target.value)}><option value="">Select…</option>{examSessions.map((es) => <option key={es.id} value={es.id}>{es.name}</option>)}</Select>
          <Select label="Class" value={classId} onChange={(e) => { setClassId(e.target.value); setSubjectId(''); setExamId(''); }}><option value="">Select…</option>{myClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          <Select label="Subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setExamId(''); }}><option value="">Select…</option>{subjects.filter((s) => !classId || classSubjects.some((cs) => cs.class_id === classId && cs.subject_id === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          <Select label="Exam" value={examId} onChange={(e) => setExamId(e.target.value)}><option value="">Select…</option>{filteredExams.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.exam_date ? formatDate(e.exam_date) : ''}</option>)}</Select>
        </div>
      </Card>
      {!examId ? <Card><EmptyState title="Select all filters" description="Choose year, term, session, class, subject, and exam to enter marks." /></Card> : classStudents.length === 0 ? <Card><EmptyState title="No students in this class" /></Card> : (
        <Card>
          <div className="mb-3 text-sm text-ink-muted">Total Marks: <span className="font-semibold text-ink dark:text-slate-100">{totalMarks}</span></div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {classStudents.map((s) => {
              const val = marks.get(s.id) ?? '';
              const pct = val !== '' ? percentage(Number(val), totalMarks) : null;
              const grade = pct !== null ? gradeFromPercentage(pct) : '—';
              return (
                <div key={s.id} className="flex items-center gap-3 py-3">
                  <Avatar name={s.full_name} src={s.photo_url} size="sm" />
                  <div className="flex-1 min-w-0"><p className="font-medium text-ink dark:text-slate-100 truncate">{s.full_name}</p><p className="text-xs text-ink-muted">#{s.admission_number}</p></div>
                  <Badge variant="primary" className="w-10 justify-center">{grade}</Badge>
                  <input type="number" min={0} max={totalMarks} value={val} onChange={(e) => setMark(s.id, e.target.value)} placeholder={`/${totalMarks}`} className="input w-20 text-center" />
                  <input type="text" value={remarks.get(s.id) ?? ''} onChange={(e) => setRemarks((prev) => new Map(prev).set(s.id, e.target.value))} placeholder="Remarks" className="input w-32 hidden sm:block" />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Modal open={showResults} onClose={() => setShowResults(false)} title="Results Summary" size="md">
        {stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Highest" value={stats.highest} icon={<CheckCheck className="h-4 w-4" />} />
              <StatCard label="Lowest" value={stats.lowest} icon={<X className="h-4 w-4" />} accent="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" />
              <StatCard label="Average" value={stats.avg.toFixed(1)} icon={<Clock className="h-4 w-4" />} accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
              <StatCard label="Pass %" value={`${stats.passPct.toFixed(0)}%`} icon={<Check className="h-4 w-4" />} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink dark:text-slate-100 mb-2">Grade Distribution</p>
              <div className="space-y-1">{Object.entries(stats.dist).sort().map(([g, count]) => (
                <div key={g} className="flex items-center justify-between text-sm">
                  <Badge variant="primary">{g}</Badge>
                  <span className="text-ink-soft dark:text-slate-300">{count} student(s)</span>
                </div>
              ))}</div>
            </div>
          </div>
        ) : <EmptyState title="No marks entered yet" />}
      </Modal>
    </div>
  );
}

// ─── Teacher Chat (tabbed: Teachers / Parents) ────────────────────────────────

export function TeacherMessages() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { teachers, parents, students, classes, classSubjects, loading } = useSchoolData();
  const [tab, setTab] = useState<'teachers' | 'parents'>('teachers');
  const [activeChat, setActiveChat] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [lastMsgMap, setLastMsgMap] = useState<Record<string, Message>>({});
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Teachers tab: all teachers except me
  const teacherList = teachers.filter((t) => t.user_id !== profile?.user_id);

  // Parents tab: only parents of students in my classes
  const myClassIds = classes.filter((c) => c.class_teacher_id === profile?.id || classSubjects.some((cs) => cs.class_id === c.id && cs.teacher_id === profile?.id)).map((c) => c.id);
  const myStudentIds = students.filter((s) => s.class_id && myClassIds.includes(s.class_id)).map((s) => s.id);

  const [parentLinks, setParentLinks] = useState<Array<{ parent: AppUser; student: Student; className: string }>>([]);
  useEffect(() => {
    if (myStudentIds.length === 0) { setParentLinks([]); return; }
    let cancelled = false;
    supabase.from('student_parents').select('parent_user_id, student_id').in('student_id', myStudentIds).then(({ data }) => {
      if (cancelled) return;
      const links = (data ?? []).map((r: { parent_user_id: string; student_id: string }) => {
        const parent = parents.find((p) => p.user_id === r.parent_user_id);
        const student = students.find((s) => s.id === r.student_id);
        const cls = classes.find((c) => c.id === student?.class_id);
        return parent && student ? { parent, student, className: cls?.name ?? '—' } : null;
      }).filter(Boolean) as Array<{ parent: AppUser; student: Student; className: string }>;
      setParentLinks(links);
    });
    return () => { cancelled = true; };
  }, [myStudentIds.join(','), parents.length, students.length, classes.length]);

  const contactList = tab === 'teachers'
    ? teacherList.map((t) => ({ user: t, label: '', subLabel: '' }))
    : parentLinks.map((l) => ({ user: l.parent, label: l.student.full_name, subLabel: l.className }));

  const filteredContacts = search.trim()
    ? contactList.filter((c) => c.user.full_name.toLowerCase().includes(search.toLowerCase()) || c.label.toLowerCase().includes(search.toLowerCase()))
    : contactList;

  const conversationId = (a: string, b: string) => [a, b].sort().join('|');

  useEffect(() => {
    if (!activeChat || !profile?.user_id) return;
    const cid = conversationId(profile.user_id, activeChat);
    supabase.from('messages').select('*').eq('conversation_id', cid).order('created_at', { ascending: true }).then(({ data }) => {
      setMessages((data as Message[]) ?? []);
      // Mark received messages as read
      const unread = (data ?? []).filter((m: Message) => m.recipient_id === profile.user_id && !m.read_at);
      if (unread.length) {
        supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unread.map((m: Message) => m.id)).then(() => {
          setMessages((prev) => prev.map((m) => m.recipient_id === profile.user_id ? { ...m, read_at: m.read_at ?? new Date().toISOString() } : m));
        });
      }
    });
  }, [activeChat, profile?.user_id]);

  // Load unread counts and last messages for all contacts
  useEffect(() => {
    if (!profile?.user_id || contactList.length === 0) return;
    (async () => {
      const uMap: Record<string, number> = {};
      const lMap: Record<string, Message> = {};
      for (const c of contactList) {
        const cid = conversationId(profile.user_id, c.user.user_id);
        const { data } = await supabase.from('messages').select('*').eq('conversation_id', cid).order('created_at', { ascending: false });
        const msgs = (data as Message[]) ?? [];
        uMap[c.user.user_id] = msgs.filter((m) => m.recipient_id === profile.user_id && !m.read_at).length;
        if (msgs[0]) lMap[c.user.user_id] = msgs[0];
      }
      setUnreadMap(uMap); setLastMsgMap(lMap);
    })();
  }, [profile?.user_id, contactList.length, tab]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChat || !profile?.user_id) return;
    const cid = conversationId(profile.user_id, activeChat);
    const { data, error } = await supabase.from('messages').insert({
      school_id: profile.school_id, sender_id: profile.user_id, recipient_id: activeChat,
      body: input, conversation_id: cid, message_type: 'text',
    }).select().single();
    if (error) { toast(error.message, 'error'); return; }
    setMessages((prev) => [...prev, data as Message]);
    setInput(''); setShowEmoji(false);
  };

  const activeContact = contactList.find((c) => c.user.user_id === activeChat);

  return (
    <div>
      <PageHeader title="Messages" subtitle="Chat with teachers and parents." icon={<MessageSquare className="h-5 w-5" />} />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr] h-[calc(100vh-220px)]">
        {/* Contacts panel */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex gap-2 p-3 border-b border-slate-100 dark:border-slate-800">
            <button onClick={() => { setTab('teachers'); setActiveChat(''); }} className={cn('flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', tab === 'teachers' ? 'bg-primary text-white' : 'bg-slate-100 text-ink-soft dark:bg-slate-800 dark:text-slate-300')}>Teachers</button>
            <button onClick={() => { setTab('parents'); setActiveChat(''); }} className={cn('flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', tab === 'parents' ? 'bg-primary text-white' : 'bg-slate-100 text-ink-soft dark:bg-slate-800 dark:text-slate-300')}>Parents</button>
          </div>
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
            : filteredContacts.length === 0 ? <div className="p-4"><EmptyState title="No contacts" /></div> : filteredContacts.map((c) => {
              const last = lastMsgMap[c.user.user_id];
              const unread = unreadMap[c.user.user_id] ?? 0;
              return (
                <button key={c.user.user_id} onClick={() => setActiveChat(c.user.user_id)} className={cn('flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50', activeChat === c.user.user_id && 'bg-primary-50 dark:bg-primary-500/10')}>
                  <div className="relative"><Avatar name={c.user.full_name} src={c.user.avatar_url} size="sm" /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-slate-100 truncate">{c.user.full_name}</p>
                    {c.label && <p className="text-xs text-primary-600 truncate">{c.label} · {c.subLabel}</p>}
                    {last && <p className="text-xs text-ink-muted truncate">{last.sender_id === profile?.user_id ? 'You: ' : ''}{last.body}</p>}
                  </div>
                  {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-white text-xs px-1.5">{unread}</span>}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Chat panel */}
        <Card className="flex flex-col overflow-hidden">
          {!activeChat ? <div className="flex-1 flex items-center justify-center"><EmptyState title="Select a conversation" description="Choose a contact to start chatting." icon={<MessageSquare className="h-8 w-8" />} /></div> : (
            <>
              <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800">
                <Avatar name={activeContact?.user.full_name ?? ''} src={activeContact?.user.avatar_url} size="sm" />
                <div><p className="font-medium text-ink dark:text-slate-100">{activeContact?.user.full_name}</p>{activeContact?.label && <p className="text-xs text-primary-600">{activeContact.label} · {activeContact.subLabel}</p>}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m) => {
                  const mine = m.sender_id === profile?.user_id;
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[70%] rounded-2xl px-3 py-2', mine ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-ink dark:text-slate-100')}>
                        <p className="text-sm">{m.body}</p>
                        <div className={cn('flex items-center gap-1 mt-0.5 text-xs', mine ? 'text-primary-100' : 'text-ink-muted')}>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {mine && (m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowEmoji((v) => !v)} className="p-2 text-ink-muted hover:text-primary-600"><Smile className="h-5 w-5" /></button>
                <button type="button" className="p-2 text-ink-muted hover:text-primary-600"><Paperclip className="h-5 w-5" /></button>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-ink dark:text-slate-100 focus:ring-2 focus:ring-primary-500/30 outline-none" />
                <Button type="submit" size="sm" leftIcon={<Send className="h-4 w-4" />}>Send</Button>
              </form>
              {showEmoji && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex gap-1 flex-wrap">
                  {['😀','😂','😍','👍','👏','🙏','❤️','🎉','🔥','✅','❌','⭐'].map((e) => (
                    <button key={e} type="button" onClick={() => { setInput((v) => v + e); setShowEmoji(false); }} className="text-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">{e}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Teacher Announcements / Calendar / Profile ──────────────────────────────

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
