import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { ClipboardList, Plus, Pencil, Trash2, Search, Calendar, Clock, MapPin, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useAcademic } from '@/context/AcademicContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { RowSkeleton } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { EXAM_SESSION_STATUSES, EXAM_SESSION_STATUS_LABELS } from '@/lib/constants';
import type { ExamSession, AcademicYear, Term, Exam, ClassRow, Subject, AppUser } from '@/types';

const SCHOOL_ID = 'ddccbf60-353f-40c5-a83f-3f8cf84eccfb';

interface SessionFormState {
  name: string;
  academic_year_id: string;
  term_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface ExamFormState {
  name: string;
  class_id: string;
  subject_id: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: string;
  room: string;
  teacher_id: string;
  total_marks: string;
  status: string;
}

const emptySessionForm: SessionFormState = {
  name: '',
  academic_year_id: '',
  term_id: '',
  start_date: '',
  end_date: '',
  status: 'draft',
};

const emptyExamForm: ExamFormState = {
  name: '',
  class_id: '',
  subject_id: '',
  exam_date: '',
  start_time: '',
  end_time: '',
  duration_minutes: '',
  room: '',
  teacher_id: '',
  total_marks: '100',
  exam_type: 'midterm',
  status: 'scheduled',
};

export function SchoolAdminExamSessions() {
  const { profile } = useAuth();
  const { examSessions, classes, subjects, teachers, loading, refresh } = useSchoolData();
  const { years, terms } = useAcademic();
  const { toast } = useToast();

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ExamSession | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(emptySessionForm);
  const [savingSession, setSavingSession] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<ExamSession | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});

  const [viewingSession, setViewingSession] = useState<ExamSession | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState<ExamFormState>(emptyExamForm);
  const [savingExam, setSavingExam] = useState(false);
  const [deleteExamTarget, setDeleteExamTarget] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState(false);

  const yearMap = useMemo(() => {
    const m: Record<string, AcademicYear> = {};
    years.forEach((y) => { m[y.id] = y; });
    return m;
  }, [years]);

  const termMap = useMemo(() => {
    const m: Record<string, Term> = {};
    terms.forEach((t) => { m[t.id] = t; });
    return m;
  }, [terms]);

  const classMap = useMemo(() => {
    const m: Record<string, ClassRow> = {};
    classes.forEach((c) => { m[c.id] = c; });
    return m;
  }, [classes]);

  const subjectMap = useMemo(() => {
    const m: Record<string, Subject> = {};
    subjects.forEach((s) => { m[s.id] = s; });
    return m;
  }, [subjects]);

  const teacherMap = useMemo(() => {
    const m: Record<string, AppUser> = {};
    teachers.forEach((t) => { m[t.user_id] = t; });
    return m;
  }, [teachers]);

  useEffect(() => {
    if (examSessions.length === 0) { setExamCounts({}); return; }
    supabase
      .from('exams')
      .select('exam_session_id')
      .in('exam_session_id', examSessions.map((s) => s.id))
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data ?? []).forEach((r: { exam_session_id: string }) => {
          counts[r.exam_session_id] = (counts[r.exam_session_id] ?? 0) + 1;
        });
        setExamCounts(counts);
      });
  }, [examSessions]);

  const filteredTerms = useMemo(() => {
    if (!sessionForm.academic_year_id) return [];
    return terms.filter((t) => t.academic_year_id === sessionForm.academic_year_id);
  }, [terms, sessionForm.academic_year_id]);

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return examSessions;
    const q = search.toLowerCase();
    return examSessions.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q) ||
      (yearMap[s.academic_year_id ?? '']?.name ?? '').toLowerCase().includes(q)
    );
  }, [examSessions, search, yearMap]);

  const openAddSession = () => {
    setEditingSession(null);
    setSessionForm(emptySessionForm);
    setSessionModalOpen(true);
  };

  const openEditSession = (s: ExamSession) => {
    setEditingSession(s);
    setSessionForm({
      name: s.name,
      academic_year_id: s.academic_year_id ?? '',
      term_id: s.term_id ?? '',
      start_date: s.start_date ?? '',
      end_date: s.end_date ?? '',
      status: s.status,
    });
    setSessionModalOpen(true);
  };

  const submitSession = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionForm.name.trim()) { toast('Session name is required', 'error'); return; }
    if (!sessionForm.academic_year_id) { toast('Academic year is required', 'error'); return; }

    setSavingSession(true);
    const willPublish = sessionForm.status === 'published';
    const payload: Record<string, unknown> = {
      school_id: SCHOOL_ID,
      name: sessionForm.name.trim(),
      academic_year_id: sessionForm.academic_year_id,
      term_id: sessionForm.term_id || null,
      start_date: sessionForm.start_date || null,
      end_date: sessionForm.end_date || null,
      status: sessionForm.status,
      published: willPublish,
      published_at: willPublish ? new Date().toISOString() : null,
      created_by: profile?.user_id ?? null,
    };

    if (editingSession) {
      if (!willPublish) { payload.published = false; payload.published_at = null; }
      const { error } = await supabase.from('exam_sessions').update(payload).eq('id', editingSession.id);
      if (error) { toast(error.message, 'error'); setSavingSession(false); return; }
      toast('Exam session updated');
    } else {
      const { error } = await supabase.from('exam_sessions').insert(payload);
      if (error) { toast(error.message, 'error'); setSavingSession(false); return; }
      toast('Exam session created');
    }
    setSavingSession(false);
    setSessionModalOpen(false);
    refresh();
  };

  const confirmDeleteSession = async () => {
    if (!deleteSessionTarget) return;
    setDeletingSession(true);
    await supabase.from('exams').delete().eq('exam_session_id', deleteSessionTarget.id);
    const { error } = await supabase.from('exam_sessions').delete().eq('id', deleteSessionTarget.id);
    setDeletingSession(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Exam session deleted');
    setDeleteSessionTarget(null);
    refresh();
  };

  const loadExams = async (sessionId: string) => {
    setExamsLoading(true);
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('exam_session_id', sessionId)
      .order('exam_date', { ascending: true });
    setExams((data as Exam[]) ?? []);
    setExamsLoading(false);
  };

  const openSessionDetail = async (s: ExamSession) => {
    setViewingSession(s);
    await loadExams(s.id);
  };

  const openAddExam = () => {
    setEditingExam(null);
    setExamForm(emptyExamForm);
    setExamModalOpen(true);
  };

  const openEditExam = (ex: Exam) => {
    setEditingExam(ex);
    setExamForm({
      name: ex.name,
      class_id: ex.class_id ?? '',
      subject_id: ex.subject_id ?? '',
      exam_date: ex.exam_date ?? '',
      start_time: ex.start_time ?? '',
      end_time: ex.end_time ?? '',
      duration_minutes: ex.duration_minutes?.toString() ?? '',
      room: ex.room ?? '',
      teacher_id: ex.teacher_id ?? '',
      total_marks: ex.total_marks?.toString() ?? '100',
      exam_type: ex.exam_type ?? 'midterm',
      status: ex.status ?? 'scheduled',
    });
    setExamModalOpen(true);
  };

  const submitExam = async (e: FormEvent) => {
    e.preventDefault();
    if (!viewingSession) return;
    if (!examForm.class_id) { toast('Class is required', 'error'); return; }
    if (!examForm.subject_id) { toast('Subject is required', 'error'); return; }

    setSavingExam(true);
    const payload: Record<string, unknown> = {
      school_id: SCHOOL_ID,
      exam_session_id: viewingSession.id,
      term_id: viewingSession.term_id,
      name: examForm.name.trim() || `${subjectMap[examForm.subject_id]?.name ?? 'Exam'} — ${classMap[examForm.class_id]?.name ?? ''}`,
      exam_type: examForm.exam_type,
      class_id: examForm.class_id,
      subject_id: examForm.subject_id,
      exam_date: examForm.exam_date || null,
      start_time: examForm.start_time || null,
      end_time: examForm.end_time || null,
      duration_minutes: examForm.duration_minutes ? parseInt(examForm.duration_minutes) : null,
      room: examForm.room || null,
      teacher_id: examForm.teacher_id || null,
      total_marks: parseFloat(examForm.total_marks) || 100,
      status: examForm.status,
    };

    if (editingExam) {
      const { error } = await supabase.from('exams').update(payload).eq('id', editingExam.id);
      if (error) { toast(error.message, 'error'); setSavingExam(false); return; }
      toast('Exam updated');
    } else {
      const { error } = await supabase.from('exams').insert(payload);
      if (error) { toast(error.message, 'error'); setSavingExam(false); return; }
      toast('Exam added to schedule');
    }
    setSavingExam(false);
    setExamModalOpen(false);
    loadExams(viewingSession.id);
  };

  const confirmDeleteExam = async () => {
    if (!deleteExamTarget || !viewingSession) return;
    setDeletingExam(true);
    const { error } = await supabase.from('exams').delete().eq('id', deleteExamTarget.id);
    setDeletingExam(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Exam deleted');
    setDeleteExamTarget(null);
    loadExams(viewingSession.id);
  };

  const sessionColumns: Column<ExamSession>[] = [
    {
      key: 'name',
      header: 'Session',
      render: (s) => (
        <div>
          <p className="font-medium text-ink dark:text-slate-100">{s.name}</p>
          <p className="text-xs text-ink-muted">
            {yearMap[s.academic_year_id ?? '']?.name ?? '—'}
            {s.term_id ? ` · ${termMap[s.term_id]?.name ?? '—'}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Duration',
      render: (s) => (
        <span className="text-ink-soft dark:text-slate-300">
          {s.start_date || s.end_date ? `${formatDate(s.start_date)} — ${formatDate(s.end_date)}` : '—'}
        </span>
      ),
    },
    {
      key: 'exams',
      header: 'Exams',
      render: (s) => <Badge variant="secondary">{examCounts[s.id] ?? 0} exam(s)</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => {
        const b = statusBadge(s.status);
        return (
          <div className="flex items-center gap-2">
            <Badge variant={b.variant}>{b.label}</Badge>
            {s.published && <Badge variant="success">Published</Badge>}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openSessionDetail(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800" title="Manage exam schedule">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => openEditSession(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteSessionTarget(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const examColumns: Column<Exam>[] = [
    {
      key: 'name',
      header: 'Exam',
      render: (ex) => (
        <div>
          <p className="font-medium text-ink dark:text-slate-100">{ex.name}</p>
          <p className="text-xs text-ink-muted">
            {subjectMap[ex.subject_id ?? '']?.name ?? '—'} · {classMap[ex.class_id ?? '']?.name ?? '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'exam_date',
      header: 'Date',
      render: (ex) => (
        <div className="flex items-center gap-1.5 text-ink-soft dark:text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-ink-muted" />
          {ex.exam_date ? formatDate(ex.exam_date) : '—'}
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (ex) => (
        <div className="flex items-center gap-1.5 text-ink-soft dark:text-slate-300">
          <Clock className="h-3.5 w-3.5 text-ink-muted" />
          {ex.start_time ? `${ex.start_time}${ex.end_time ? `–${ex.end_time}` : ''}` : '—'}
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Room',
      render: (ex) => (
        <span className="text-ink-soft dark:text-slate-300">
          {ex.room ? <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-ink-muted" />{ex.room}</span> : '—'}
        </span>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (ex) => (
        <span className="text-ink-soft dark:text-slate-300">{ex.teacher_id ? (teacherMap[ex.teacher_id]?.full_name ?? '—') : '—'}</span>
      ),
    },
    {
      key: 'marks',
      header: 'Max Marks',
      render: (ex) => <Badge variant="secondary">{ex.total_marks}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (ex) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEditExam(ex)} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteExamTarget(ex)} className="rounded-lg p-1.5 text-ink-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (viewingSession) {
    return (
      <div>
        <button onClick={() => setViewingSession(null)} className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink dark:hover:text-slate-100">
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </button>

        <PageHeader
          title={viewingSession.name}
          subtitle={`${yearMap[viewingSession.academic_year_id ?? '']?.name ?? '—'}${viewingSession.term_id ? ` · ${termMap[viewingSession.term_id]?.name ?? ''}` : ''}`}
          icon={<ClipboardList className="h-6 w-6" />}
          action={<Button onClick={openAddExam} leftIcon={<Plus className="h-4 w-4" />}>Add Exam</Button>}
        />

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-ink-muted">Duration</p>
            <p className="mt-1 font-medium text-ink dark:text-slate-100">
              {viewingSession.start_date || viewingSession.end_date
                ? `${formatDate(viewingSession.start_date)} — ${formatDate(viewingSession.end_date)}`
                : '—'}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-ink-muted">Total Exams</p>
            <p className="mt-1 font-medium text-ink dark:text-slate-100">{exams.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-ink-muted">Status</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={statusBadge(viewingSession.status).variant}>{statusBadge(viewingSession.status).label}</Badge>
              {viewingSession.published && <Badge variant="success">Published</Badge>}
            </div>
          </Card>
        </div>

        <Card>
          {examsLoading ? (
            <RowSkeleton rows={4} />
          ) : exams.length === 0 ? (
            <EmptyState title="No exams scheduled" description='Click "Add Exam" to schedule individual exams with subjects, classes, dates, and rooms.' icon={<BookOpen className="h-10 w-10" />} />
          ) : (
            <DataTable columns={examColumns} data={exams} rowKey={(ex) => ex.id} />
          )}
        </Card>

        <Modal
          open={examModalOpen}
          onClose={() => setExamModalOpen(false)}
          title={editingExam ? 'Edit Exam' : 'Add Exam'}
          description={`Schedule an exam in ${viewingSession.name}`}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setExamModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="exam-form" loading={savingExam}>{editingExam ? 'Save Changes' : 'Add Exam'}</Button>
            </>
          }
        >
          <form id="exam-form" onSubmit={submitExam} className="space-y-4">
            <Input label="Exam Name" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} placeholder="Auto-generated from subject + class if left blank" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Class *" required value={examForm.class_id} onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}>
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select label="Subject *" required value={examForm.subject_id} onChange={(e) => setExamForm({ ...examForm, subject_id: e.target.value })}>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Input label="Exam Date" type="date" value={examForm.exam_date} onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })} />
              <Select label="Invigilating Teacher" value={examForm.teacher_id} onChange={(e) => setExamForm({ ...examForm, teacher_id: e.target.value })}>
                <option value="">Unassigned</option>
                {teachers.map((t) => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
              </Select>
              <Input label="Start Time" type="time" value={examForm.start_time} onChange={(e) => setExamForm({ ...examForm, start_time: e.target.value })} />
              <Input label="End Time" type="time" value={examForm.end_time} onChange={(e) => setExamForm({ ...examForm, end_time: e.target.value })} />
              <Input label="Duration (minutes)" type="number" value={examForm.duration_minutes} onChange={(e) => setExamForm({ ...examForm, duration_minutes: e.target.value })} />
              <Input label="Room" value={examForm.room} onChange={(e) => setExamForm({ ...examForm, room: e.target.value })} placeholder="e.g. Hall A" />
              <Input label="Total Marks" type="number" value={examForm.total_marks} onChange={(e) => setExamForm({ ...examForm, total_marks: e.target.value })} />
              <Select label="Exam Type" value={examForm.exam_type} onChange={(e) => setExamForm({ ...examForm, exam_type: e.target.value })}>
                <option value="midterm">Midterm</option>
                <option value="endterm">End Term</option>
                <option value="quiz">Quiz</option>
                <option value="assessment">Assessment</option>
                <option value="final">Final</option>
              </Select>
              <Select label="Status" value={examForm.status} onChange={(e) => setExamForm({ ...examForm, status: e.target.value })}>
                {EXAM_SESSION_STATUSES.map((s) => <option key={s} value={s}>{EXAM_SESSION_STATUS_LABELS[s]}</option>)}
              </Select>
            </div>
          </form>
        </Modal>

        <Modal
          open={!!deleteExamTarget}
          onClose={() => setDeleteExamTarget(null)}
          title="Delete Exam"
          description={`Delete ${deleteExamTarget?.name}?`}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteExamTarget(null)}>Cancel</Button>
              <Button variant="danger" loading={deletingExam} onClick={confirmDeleteExam}>Delete</Button>
            </>
          }
        >
          <p className="text-sm text-ink-muted">This will also delete any marks recorded for this exam.</p>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Exam Sessions"
        subtitle="Create exam sessions and manage the exam schedule"
        icon={<ClipboardList className="h-6 w-6" />}
        action={<Button onClick={openAddSession} leftIcon={<Plus className="h-4 w-4" />}>Add Session</Button>}
      />

      <Card>
        <div className="mb-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name, status, year…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <RowSkeleton rows={5} />
        ) : filteredSessions.length === 0 ? (
          <EmptyState title="No exam sessions" description={search ? 'Try adjusting your search.' : 'Click "Add Session" to create your first exam session.'} icon={<ClipboardList className="h-10 w-10" />} />
        ) : (
          <DataTable columns={sessionColumns} data={filteredSessions} rowKey={(s) => s.id} onRowClick={openSessionDetail} />
        )}
      </Card>

      <Modal
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title={editingSession ? 'Edit Exam Session' : 'Add Exam Session'}
        description={editingSession ? `Editing ${editingSession.name}` : 'Create a new exam session container'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSessionModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="session-form" loading={savingSession}>{editingSession ? 'Save Changes' : 'Add Session'}</Button>
          </>
        }
      >
        <form id="session-form" onSubmit={submitSession} className="space-y-4">
          <Input label="Session Name *" required value={sessionForm.name} onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })} placeholder="e.g. Mid-Term Exams 2025" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Academic Year *"
              required
              value={sessionForm.academic_year_id}
              onChange={(e) => setSessionForm({ ...sessionForm, academic_year_id: e.target.value, term_id: '' })}
            >
              <option value="">Select year</option>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </Select>
            <Select label="Term" value={sessionForm.term_id} onChange={(e) => setSessionForm({ ...sessionForm, term_id: e.target.value })} disabled={!sessionForm.academic_year_id}>
              <option value="">Select term</option>
              {filteredTerms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Input label="Start Date" type="date" value={sessionForm.start_date} onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })} />
            <Input label="End Date" type="date" value={sessionForm.end_date} onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })} />
          </div>
          <Select label="Status" value={sessionForm.status} onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}>
            {EXAM_SESSION_STATUSES.map((s) => (
              <option key={s} value={s}>{EXAM_SESSION_STATUS_LABELS[s]}</option>
            ))}
          </Select>
          {sessionForm.status === 'published' && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Setting status to "Published" will make results visible and record the publish timestamp.
              </p>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={!!deleteSessionTarget}
        onClose={() => setDeleteSessionTarget(null)}
        title="Delete Exam Session"
        description={`Delete ${deleteSessionTarget?.name}? All exams within this session will also be deleted.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteSessionTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deletingSession} onClick={confirmDeleteSession}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
