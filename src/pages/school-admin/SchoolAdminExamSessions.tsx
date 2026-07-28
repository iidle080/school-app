import { useState, useMemo, type FormEvent } from 'react';
import { ClipboardList, Plus, Pencil, Trash2, Search } from 'lucide-react';
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
import { formatDate, cn } from '@/lib/utils';
import { EXAM_SESSION_STATUSES, EXAM_SESSION_STATUS_LABELS } from '@/lib/constants';
import type { ExamSession, AcademicYear, Term } from '@/types';

const SCHOOL_ID = 'ddccbf60-353f-40c5-a83f-3f8cf84eccfb';

interface SessionFormState {
  name: string;
  academic_year_id: string;
  term_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

const emptyForm: SessionFormState = {
  name: '',
  academic_year_id: '',
  term_id: '',
  start_date: '',
  end_date: '',
  status: 'draft',
};

export function SchoolAdminExamSessions() {
  const { profile } = useAuth();
  const { examSessions, loading, refresh } = useSchoolData();
  const { years, terms } = useAcademic();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExamSession | null>(null);
  const [form, setForm] = useState<SessionFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ExamSession | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});

  // Load exam counts per session
  useMemo(() => {
    if (examSessions.length === 0) {
      setExamCounts({});
      return;
    }
    supabase
      .from('exams')
      .select('exam_session_id')
      .in('exam_session_id', examSessions.map((s) => s.id))
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data ?? []).forEach((r: any) => {
          counts[r.exam_session_id] = (counts[r.exam_session_id] ?? 0) + 1;
        });
        setExamCounts(counts);
      });
  }, [examSessions]);

  const yearMap = useMemo(() => {
    const map: Record<string, AcademicYear> = {};
    years.forEach((y) => { map[y.id] = y; });
    return map;
  }, [years]);

  const termMap = useMemo(() => {
    const map: Record<string, Term> = {};
    terms.forEach((t) => { map[t.id] = t; });
    return map;
  }, [terms]);

  const filteredTerms = useMemo(() => {
    if (!form.academic_year_id) return [];
    return terms.filter((t) => t.academic_year_id === form.academic_year_id);
  }, [terms, form.academic_year_id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return examSessions;
    const q = search.toLowerCase();
    return examSessions.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q) ||
      (yearMap[s.academic_year_id ?? '']?.name ?? '').toLowerCase().includes(q)
    );
  }, [examSessions, search, yearMap]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s: ExamSession) => {
    setEditing(s);
    setForm({
      name: s.name,
      academic_year_id: s.academic_year_id ?? '',
      term_id: s.term_id ?? '',
      start_date: s.start_date ?? '',
      end_date: s.end_date ?? '',
      status: s.status,
    });
    setModalOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Session name is required', 'error');
      return;
    }
    if (!form.academic_year_id) {
      toast('Academic year is required', 'error');
      return;
    }

    setSaving(true);

    const willPublish = form.status === 'published';
    const payload: any = {
      school_id: SCHOOL_ID,
      name: form.name.trim(),
      academic_year_id: form.academic_year_id,
      term_id: form.term_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      published: willPublish,
      published_at: willPublish ? new Date().toISOString() : null,
      created_by: profile?.user_id ?? null,
    };

    if (editing) {
      // If not publishing now, keep existing published state unless explicitly unpublishing
      if (!willPublish) {
        payload.published = false;
        payload.published_at = null;
      }
      const { error } = await supabase.from('exam_sessions').update(payload).eq('id', editing.id);
      if (error) {
        toast(error.message, 'error');
        setSaving(false);
        return;
      }
      toast('Exam session updated');
    } else {
      const { error } = await supabase.from('exam_sessions').insert(payload);
      if (error) {
        toast(error.message, 'error');
        setSaving(false);
        return;
      }
      toast('Exam session created');
    }

    setSaving(false);
    setModalOpen(false);
    refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    // Delete exams within session first
    await supabase.from('exams').delete().eq('exam_session_id', deleteTarget.id);
    const { error } = await supabase.from('exam_sessions').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Exam session deleted');
    setDeleteTarget(null);
    refresh();
  };

  const columns: Column<ExamSession>[] = [
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
          <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Exam Sessions"
        subtitle="Create and manage exam sessions"
        icon={<ClipboardList className="h-6 w-6" />}
        action={<Button onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>Add Session</Button>}
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
        ) : filtered.length === 0 ? (
          <EmptyState title="No exam sessions" description={search ? 'Try adjusting your search.' : 'Click "Add Session" to create your first exam session.'} icon={<ClipboardList className="h-10 w-10" />} />
        ) : (
          <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Exam Session' : 'Add Exam Session'}
        description={editing ? `Editing ${editing.name}` : 'Create a new exam session'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="session-form" loading={saving}>{editing ? 'Save Changes' : 'Add Session'}</Button>
          </>
        }
      >
        <form id="session-form" onSubmit={submit} className="space-y-4">
          <Input label="Session Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mid-Term Exams 2025" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Academic Year *"
              required
              value={form.academic_year_id}
              onChange={(e) => setForm({ ...form, academic_year_id: e.target.value, term_id: '' })}
            >
              <option value="">Select year</option>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </Select>
            <Select label="Term" value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })} disabled={!form.academic_year_id}>
              <option value="">Select term</option>
              {filteredTerms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End Date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {EXAM_SESSION_STATUSES.map((s) => (
              <option key={s} value={s}>{EXAM_SESSION_STATUS_LABELS[s]}</option>
            ))}
          </Select>
          {form.status === 'published' && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Setting status to "Published" will make results visible and record the publish timestamp.
              </p>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Exam Session"
        description={`Delete ${deleteTarget?.name}? All exams within this session will also be deleted.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
