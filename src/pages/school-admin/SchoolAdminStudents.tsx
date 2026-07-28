import { useState, useMemo, type FormEvent } from 'react';
import { GraduationCap, Plus, Pencil, Trash2, Upload, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { RowSkeleton } from '@/components/ui/Spinner';
import { uploadFile, cn } from '@/lib/utils';
import type { Student, ClassRow } from '@/types';

const SCHOOL_ID = 'ddccbf60-353f-40c5-a83f-3f8cf84eccfb';

interface StudentFormState {
  full_name: string;
  admission_number: string;
  gender: string;
  date_of_birth: string;
  class_id: string;
  phone_number: string;
  address: string;
  nationality: string;
  medical_notes: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  enrollment_status: string;
}

const emptyForm: StudentFormState = {
  full_name: '',
  admission_number: '',
  gender: '',
  date_of_birth: '',
  class_id: '',
  phone_number: '',
  address: '',
  nationality: '',
  medical_notes: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  enrollment_status: 'active',
};

export function SchoolAdminStudents() {
  const { profile } = useAuth();
  const { students, classes, loading, refresh } = useSchoolData();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormState>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const classNameMap = useMemo(() => {
    const map: Record<string, ClassRow> = {};
    classes.forEach((c) => { map[c.id] = c; });
    return map;
  }, [classes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter((s) =>
      s.full_name.toLowerCase().includes(q) ||
      s.admission_number.toLowerCase().includes(q) ||
      (s.gender ?? '').toLowerCase().includes(q) ||
      (classNameMap[s.class_id ?? '']?.name ?? '').toLowerCase().includes(q)
    );
  }, [students, search, classNameMap]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      full_name: s.full_name,
      admission_number: s.admission_number,
      gender: s.gender ?? '',
      date_of_birth: s.date_of_birth ?? '',
      class_id: s.class_id ?? '',
      phone_number: s.phone_number ?? '',
      address: s.address ?? '',
      nationality: s.nationality ?? '',
      medical_notes: s.medical_notes ?? '',
      emergency_contact_name: s.emergency_contact_name ?? '',
      emergency_contact_phone: s.emergency_contact_phone ?? '',
      enrollment_status: s.enrollment_status ?? 'active',
    });
    setPhotoFile(null);
    setPhotoPreview(s.photo_url);
    setModalOpen(true);
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!photoFile && !editing) {
      toast('Student photo is required', 'error');
      return;
    }
    if (!form.full_name.trim() || !form.admission_number.trim()) {
      toast('Full name and admission number are required', 'error');
      return;
    }

    setSaving(true);
    let photoUrl = editing?.photo_url ?? null;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${SCHOOL_ID}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const url = await uploadFile('student-photos', path, photoFile);
      if (url) {
        photoUrl = url;
      } else {
        toast('Failed to upload photo, but student will still be saved', 'error');
      }
    }

    const payload = {
      school_id: SCHOOL_ID,
      full_name: form.full_name.trim(),
      admission_number: form.admission_number.trim(),
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      class_id: form.class_id || null,
      phone_number: form.phone_number || null,
      address: form.address || null,
      nationality: form.nationality || null,
      medical_notes: form.medical_notes || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      enrollment_status: form.enrollment_status,
      photo_url: photoUrl,
    };

    if (editing) {
      const { error } = await supabase.from('students').update(payload).eq('id', editing.id);
      if (error) {
        toast(error.message, 'error');
        setSaving(false);
        return;
      }
      toast('Student updated successfully');
    } else {
      const { error } = await supabase.from('students').insert({ ...payload, admitted_at: new Date().toISOString() });
      if (error) {
        toast(error.message, 'error');
        setSaving(false);
        return;
      }
      toast('Student added successfully');
    }

    setSaving(false);
    setModalOpen(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('students').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Student deleted');
    setDeleteTarget(null);
    refresh();
  };

  const columns: Column<Student>[] = [
    {
      key: 'full_name',
      header: 'Student',
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.full_name} src={s.photo_url} size="sm" />
          <div>
            <p className="font-medium text-ink dark:text-slate-100">{s.full_name}</p>
            <p className="text-xs text-ink-muted">{s.admission_number}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      render: (s) => <span className="text-ink-soft dark:text-slate-300">{classNameMap[s.class_id ?? '']?.name ?? '—'}</span>,
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (s) => <span className="text-ink-soft dark:text-slate-300">{s.gender ?? '—'}</span>,
    },
    {
      key: 'enrollment_status',
      header: 'Status',
      render: (s) => {
        const b = statusBadge(s.enrollment_status);
        return <Badge variant={b.variant}>{b.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }} className="rounded-lg p-1.5 text-ink-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Manage student enrollment and records"
        icon={<GraduationCap className="h-6 w-6" />}
        action={<Button onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>Add Student</Button>}
      />

      <Card>
        <div className="mb-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name, admission #, class, gender…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <RowSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No students found" description={search ? 'Try adjusting your search.' : 'Click "Add Student" to enroll your first student.'} icon={<GraduationCap className="h-10 w-10" />} />
        ) : (
          <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Student' : 'Add Student'}
        description={editing ? `Editing ${editing.full_name}` : 'Enroll a new student'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="student-form" loading={saving}>{editing ? 'Save Changes' : 'Add Student'}</Button>
          </>
        }
      >
        <form id="student-form" onSubmit={submit} className="space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="input-label">Student Photo {!editing && <span className="text-rose-500">*</span>}</label>
            <div className="flex items-center gap-4">
              <Avatar name={form.full_name || 'Student'} src={photoPreview} size="lg" />
              <div>
                <label className={cn('btn btn-secondary cursor-pointer', saving && 'opacity-50 pointer-events-none')}>
                  <Upload className="h-4 w-4" />
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} disabled={saving} />
                </label>
                <p className="text-xs text-ink-muted mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full Name *" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" />
            <Input label="Admission Number *" required value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} placeholder="ADM-001" />
            <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            <Select label="Class" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Phone Number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="+1 234 567 8900" />
            <Input label="Nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="e.g. American" />
            <Select label="Enrollment Status" value={form.enrollment_status} onChange={(e) => setForm({ ...form, enrollment_status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
              <option value="suspended">Suspended</option>
            </Select>
          </div>

          <Textarea label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City, Country" />
          <Textarea label="Medical Notes" value={form.medical_notes} onChange={(e) => setForm({ ...form, medical_notes: e.target.value })} placeholder="Allergies, conditions, medications…" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Emergency Contact Name" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} placeholder="Jane Doe" />
            <Input label="Emergency Contact Phone" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} placeholder="+1 234 567 8900" />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Student"
        description={`Are you sure you want to delete ${deleteTarget?.full_name}? This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Deleting this student will permanently remove their record from the system.
        </p>
      </Modal>
    </div>
  );
}
