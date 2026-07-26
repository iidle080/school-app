import { useEffect, useState, type FormEvent } from 'react';
import { GraduationCap, Plus, Pencil, X, Phone, AlertCircle, UserPlus, Check, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { RowSkeleton } from '@/components/ui/Spinner';
import type { Student, AppUser, ClassRow, Relationship } from '@/types';

export function SchoolAdminStudents() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { students, classes, parents, loading, refresh } = useSchoolData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);

  const columns: Column<Student>[] = [
    {
      key: 'name', header: 'Student',
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.full_name} src={s.photo_url} size="sm" />
          <div>
            <p className="font-medium text-ink dark:text-slate-100">{s.full_name}</p>
            <p className="text-xs text-ink-muted">#{s.admission_number}</p>
          </div>
        </div>
      ),
    },
    { key: 'gender', header: 'Gender', render: (s) => <span className="capitalize text-ink-soft dark:text-slate-300">{s.gender ?? '—'}</span> },
    { key: 'class', header: 'Class', render: (s) => <span className="text-ink-soft dark:text-slate-300">{className(classes, s.class_id)}</span> },
    { key: 'status', header: 'Status', render: (s) => { const b = statusBadge(s.enrollment_status); return <Badge variant={b.variant}>{b.label}</Badge>; } },
    {
      key: 'actions', header: '',
      render: (s) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setViewing(s)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setShowForm(true); }} leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Manage student profiles, enrollment, and parent links."
        icon={<GraduationCap className="h-5 w-5" />}
        action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setShowForm(true); }}>Add Student</Button>}
      />

      {loading ? <RowSkeleton /> : (
        <Card>
          <DataTable
            columns={columns}
            data={students}
            rowKey={(s) => s.id}
            searchKeys={['full_name', 'admission_number']}
            searchPlaceholder="Search by name or admission number…"
            emptyTitle="No students yet"
            emptyDescription="Add your first student to get started."
          />
        </Card>
      )}

      <StudentFormModal
        open={showForm}
        student={editing}
        classes={classes}
        schoolId={profile?.school_id ?? ''}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={() => { setShowForm(false); setEditing(null); refresh(); }}
      />

      <StudentDetailModal
        student={viewing}
        classes={classes}
        parents={parents}
        schoolId={profile?.school_id ?? ''}
        onClose={() => setViewing(null)}
        onChanged={refresh}
        toast={toast}
      />
    </div>
  );
}

function className(classes: ClassRow[], id: string | null): string {
  if (!id) return '—';
  return classes.find((c) => c.id === id)?.name ?? '—';
}

function StudentFormModal({ open, student, classes, schoolId, onClose, onSaved }: {
  open: boolean; student: Student | null; classes: ClassRow[]; schoolId: string;
  onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    admission_number: '', full_name: '', gender: '', date_of_birth: '', class_id: '',
    emergency_contact_name: '', emergency_contact_phone: '', medical_notes: '', enrollment_status: 'active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        admission_number: student.admission_number, full_name: student.full_name,
        gender: student.gender ?? '', date_of_birth: student.date_of_birth ?? '', class_id: student.class_id ?? '',
        emergency_contact_name: student.emergency_contact_name ?? '', emergency_contact_phone: student.emergency_contact_phone ?? '',
        medical_notes: student.medical_notes ?? '', enrollment_status: student.enrollment_status,
      });
    } else {
      setForm({
        admission_number: `ADM-${Date.now().toString().slice(-6)}`, full_name: '', gender: '', date_of_birth: '',
        class_id: '', emergency_contact_name: '', emergency_contact_phone: '', medical_notes: '', enrollment_status: 'active',
      });
    }
  }, [student, open]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      school_id: schoolId, admission_number: form.admission_number, full_name: form.full_name,
      gender: form.gender || null, date_of_birth: form.date_of_birth || null, class_id: form.class_id || null,
      emergency_contact_name: form.emergency_contact_name || null, emergency_contact_phone: form.emergency_contact_phone || null,
      medical_notes: form.medical_notes || null, enrollment_status: form.enrollment_status,
    };
    const { error } = student
      ? await supabase.from('students').update(payload).eq('id', student.id)
      : await supabase.from('students').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(student ? 'Student updated.' : 'Student added.', 'success');
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={student ? 'Edit Student' : 'Add Student'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="student-form" type="submit" loading={saving}>{student ? 'Save changes' : 'Add student'}</Button></>}>
      <form id="student-form" onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full name" name="full_name" required value={form.full_name} onChange={set('full_name')} />
          <Input label="Admission number" name="admission_number" required value={form.admission_number} onChange={set('admission_number')} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Gender" value={form.gender} onChange={set('gender')}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Date of birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
        </div>
        <Select label="Class" value={form.class_id} onChange={set('class_id')}>
          <option value="">Unassigned</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Emergency contact name" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />
          <Input label="Emergency contact phone" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} leftIcon={<Phone className="h-4 w-4" />} />
        </div>
        <Textarea label="Medical notes" value={form.medical_notes} onChange={set('medical_notes')} placeholder="Allergies, conditions, medication…" />
        <Select label="Enrollment status" value={form.enrollment_status} onChange={set('enrollment_status')}>
          <option value="active">Active</option>
          <option value="transferred">Transferred</option>
          <option value="graduated">Graduated</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </Select>
      </form>
    </Modal>
  );
}

function StudentDetailModal({ student, classes, parents, schoolId, onClose, onChanged, toast }: {
  student: Student | null; classes: ClassRow[]; parents: AppUser[]; schoolId: string;
  onClose: () => void; onChanged: () => void; toast: (m: string, t?: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const [linked, setLinked] = useState<Array<{ id: string; parent_user_id: string; full_name: string; relationship: string; is_primary_guardian: boolean }>>([]);
  const [addParent, setAddParent] = useState(false);
  const [selectedParent, setSelectedParent] = useState('');

  const relationshipOptions = [
    { value: 'father', label: 'Father' },
    { value: 'mother', label: 'Mother' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'aunt', label: 'Aunt' },
    { value: 'uncle', label: 'Uncle' },
    { value: 'other', label: 'Other' },
  ];

  const loadLinked = () => {
    if (!student) return;
    supabase.from('student_parents').select('id, relationship, parent_user_id, is_primary_guardian').eq('student_id', student.id).then(({ data }) => {
      const rows = (data ?? []).map((r: { id: string; relationship: string; parent_user_id: string; is_primary_guardian: boolean }) => {
        const p = parents.find((pp) => pp.user_id === r.parent_user_id);
        return { id: r.id, parent_user_id: r.parent_user_id, full_name: p?.full_name ?? 'Unknown', relationship: r.relationship, is_primary_guardian: r.is_primary_guardian };
      });
      setLinked(rows);
    });
  };

  useEffect(() => { loadLinked(); }, [student, parents]);

  if (!student) return null;

  const linkParent = async () => {
    if (!selectedParent) return;
    const p = parents.find((pp) => pp.id === selectedParent);
    if (!p) return;
    const { error } = await supabase.from('student_parents').insert({
      school_id: schoolId, student_id: student.id, parent_user_id: p.user_id, relationship: 'guardian',
      is_primary_guardian: linked.length === 0,
    });
    if (error) { toast(error.message, 'error'); return; }
    toast('Parent linked.', 'success');
    setAddParent(false); setSelectedParent('');
    loadLinked(); onChanged();
  };

  const unlink = async (id: string) => {
    await supabase.from('student_parents').delete().eq('id', id);
    setLinked((prev) => prev.filter((l) => l.id !== id));
    toast('Parent unlinked.', 'success'); onChanged();
  };

  const updateRelationship = async (id: string, relationship: string) => {
    await supabase.from('student_parents').update({ relationship }).eq('id', id);
    setLinked((prev) => prev.map((l) => l.id === id ? { ...l, relationship } : l));
    onChanged();
  };

  const setPrimary = async (id: string) => {
    const others = linked.filter((l) => l.id !== id);
    await Promise.all(others.map((l) => supabase.from('student_parents').update({ is_primary_guardian: false }).eq('id', l.id)));
    await supabase.from('student_parents').update({ is_primary_guardian: true }).eq('id', id);
    setLinked((prev) => prev.map((l) => ({ ...l, is_primary_guardian: l.id === id })));
    toast('Primary guardian set.', 'success'); onChanged();
  };

  return (
    <Modal open={!!student} onClose={onClose} title={student.full_name} description={`Admission #${student.admission_number}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar name={student.full_name} src={student.photo_url} size="lg" />
          <div>
            <p className="text-sm text-ink-muted">Class: {className(classes, student.class_id)}</p>
            <p className="text-sm text-ink-muted">Gender: {student.gender ?? '—'}</p>
            <p className="text-sm text-ink-muted">DOB: {student.date_of_birth ?? '—'}</p>
          </div>
        </div>
        {student.medical_notes && (
          <div className="rounded-xl bg-warning-bg p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-warning-dark shrink-0 mt-0.5" />
            <p className="text-sm text-warning-dark">{student.medical_notes}</p>
          </div>
        )}

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-ink dark:text-slate-100">Linked Parents</p>
            <Button size="sm" variant="secondary" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setAddParent((v) => !v)}>Link</Button>
          </div>
          {addParent && (
            <div className="flex gap-2 mb-3">
              <Select value={selectedParent} onChange={(e) => setSelectedParent(e.target.value)} className="flex-1">
                <option value="">Select parent…</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </Select>
              <Button size="sm" onClick={linkParent}>Add</Button>
            </div>
          )}
          <div className="space-y-2">
            {linked.map((l) => (
              <div key={l.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink dark:text-slate-100">{l.full_name}</p>
                    {l.is_primary_guardian && <Badge variant="primary">Primary</Badge>}
                  </div>
                  <button onClick={() => unlink(l.id)} className="text-ink-muted hover:text-error"><X className="h-4 w-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={l.relationship} onChange={(e) => updateRelationship(l.id, e.target.value)} className="text-xs py-1">
                    {relationshipOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </Select>
                  {!l.is_primary_guardian && (
                    <Button size="sm" variant="ghost" onClick={() => setPrimary(l.id)}>Set as primary</Button>
                  )}
                </div>
              </div>
            ))}
            {linked.length === 0 && <p className="text-sm text-ink-muted py-2">No parents linked yet.</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
