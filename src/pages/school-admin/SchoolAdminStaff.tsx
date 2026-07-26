import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Send, Copy, Check, Phone, Mail, X, RotateCw, Ban, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { RowSkeleton } from '@/components/ui/Spinner';
import { generateToken, daysFromNow, formatDate, relativeTime } from '@/lib/utils';
import { INVITATION_EXPIRY_DAYS, DEMO_MODE, DEMO_PASSWORD } from '@/lib/constants';
import { demoEmailFor, schoolSlugFromName, createDemoUser, type DemoCredentials } from '@/lib/demo';
import { DemoCredentialsCard } from '@/components/demo/DemoUI';
import { useSchool } from '@/hooks/useSchool';
import type { AppUser, Invitation, ClassRow, Student } from '@/types';
import type { UserRole } from '@/types';

// Shared staff-management page used for Teachers and Parents.
export function StaffManagement({ role }: { role: 'teacher' | 'parent' }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { teachers, parents, students, classes, loading, refresh } = useSchoolData();
  const { school } = useSchool();
  const isTeacher = role === 'teacher';
  const list = isTeacher ? teachers : parents;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [showInvite, setShowInvite] = useState<AppUser | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [copied, setCopied] = useState(false);
  const [demoCreds, setDemoCreds] = useState<DemoCredentials | null>(null);
  const [editingLinks, setEditingLinks] = useState<AppUser | null>(null);

  const loadInvites = async () => {
    if (!profile?.school_id) return;
    const { data } = await supabase.from('invitations').select('*').eq('school_id', profile.school_id).eq('role', role).order('created_at', { ascending: false });
    setInvitations((data as Invitation[]) ?? []);
  };
  useEffect(() => { loadInvites(); }, [profile?.school_id, role]);

  const pendingInvite = (userId: string) => invitations.find((i) => i.email === list.find((u) => u.id === userId)?.user_id);

  const columns: Column<AppUser>[] = [
    {
      key: 'name', header: 'Name',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.full_name} src={u.avatar_url} size="sm" />
          <div>
            <p className="font-medium text-ink dark:text-slate-100">{u.full_name}</p>
            <p className="text-xs text-ink-muted">{u.phone ?? 'No phone'}</p>
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (u) => u.active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Disabled</Badge> },
    { key: 'joined', header: 'Joined', render: (u) => <span className="text-xs text-ink-muted">{formatDate(u.created_at)}</span> },
    {
      key: 'actions', header: '',
      render: (u) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => { setEditing(u); setShowForm(true); }} leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button>
          {!isTeacher && <Button size="sm" variant="secondary" onClick={() => setEditingLinks(u)} leftIcon={<UserPlus className="h-3.5 w-3.5" />}>Children</Button>}
          <Button size="sm" variant="secondary" onClick={() => { setShowInvite(u); const inv = pendingInvite(u.id); setInviteLink(inv ? `${window.location.origin}/invite/${inv.token}` : null); }}>
            Invite
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={isTeacher ? 'Teachers' : 'Parents'}
        subtitle={isTeacher ? 'Manage teaching staff and send invitations.' : 'Manage parents and link them to students.'}
        action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setShowForm(true); }}>Add {isTeacher ? 'Teacher' : 'Parent'}</Button>}
      />
      {loading ? <RowSkeleton /> : (
        <Card>
          <DataTable columns={columns} data={list} rowKey={(u) => u.id} searchKeys={['full_name', 'phone']} searchPlaceholder={`Search ${role}s…`} emptyTitle={`No ${role}s yet`} />
        </Card>
      )}

      <StaffFormModal
        open={showForm}
        editing={editing}
        role={role}
        schoolId={profile?.school_id ?? ''}
        classes={classes}
        students={students}
        schoolName={school?.name}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={() => { setShowForm(false); setEditing(null); refresh(); }}
        onDemoCreated={(creds) => { setShowForm(false); setEditing(null); refresh(); setDemoCreds(creds); }}
      />

      {role === 'parent' && (
        <ParentLinksModal
          open={!!editingLinks}
          parent={editingLinks}
          students={students}
          classes={classes}
          schoolId={profile?.school_id ?? ''}
          onClose={() => setEditingLinks(null)}
          onChanged={refresh}
        />
      )}

      <Modal open={!!demoCreds} onClose={() => setDemoCreds(null)} title={`${role === 'teacher' ? 'Teacher' : 'Parent'} account ready`}>
        {demoCreds && <DemoCredentialsCard credentials={demoCreds} />}
      </Modal>

      <InviteModal
        open={!!showInvite}
        person={showInvite}
        role={role}
        link={inviteLink}
        copied={copied}
        toast={toast}
        onClose={() => { setShowInvite(null); setInviteLink(null); setCopied(false); }}
        onGenerate={async (person) => {
          if (!user || !profile?.school_id) return;
          const email = (person as AppUser & { email?: string }).phone ? undefined : undefined;
          void email;
          const token = generateToken();
          const { error } = await supabase.from('invitations').insert({
            school_id: profile.school_id, token, role, email: null, phone: person.phone, full_name: person.full_name,
            status: 'pending', channel: 'sms', expires_at: daysFromNow(INVITATION_EXPIRY_DAYS), created_by: user.id,
          });
          if (error) { toast(error.message, 'error'); return; }
          setInviteLink(`${window.location.origin}/invite/${token}`);
          toast('Invitation generated.', 'success');
          loadInvites();
        }}
      />
    </div>
  );
}

export function SchoolAdminTeachers() { return <StaffManagement role="teacher" />; }
export function SchoolAdminParents() { return <StaffManagement role="parent" />; }

function StaffFormModal({ open, editing, role, schoolId, schoolName, students, classes, onClose, onSaved, onDemoCreated }: {
  open: boolean; editing: AppUser | null; role: UserRole; schoolId: string;
  classes: ClassRow[]; students: Student[]; schoolName?: string;
  onClose: () => void; onSaved: () => void; onDemoCreated: (c: DemoCredentials) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [studentLinks, setStudentLinks] = useState<Array<{ student_id: string; relationship: string; is_primary_guardian: boolean }>>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  useEffect(() => {
    setForm({ full_name: editing?.full_name ?? '', phone: editing?.phone ?? '' });
    setStudentLinks([]);
    setStudentSearch('');
    setShowStudentPicker(false);
  }, [editing, open]);

  const relationshipOptions = [
    { value: 'father', label: 'Father' },
    { value: 'mother', label: 'Mother' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'aunt', label: 'Aunt' },
    { value: 'uncle', label: 'Uncle' },
    { value: 'other', label: 'Other' },
  ];

  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return s.full_name.toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q);
  });

  const addStudentLink = (studentId: string) => {
    if (studentLinks.some((l) => l.student_id === studentId)) return;
    setStudentLinks((prev) => [...prev, { student_id: studentId, relationship: 'guardian', is_primary_guardian: prev.length === 0 }]);
  };

  const removeStudentLink = (studentId: string) => {
    setStudentLinks((prev) => prev.filter((l) => l.student_id !== studentId));
  };

  const updateLink = (studentId: string, field: 'relationship' | 'is_primary_guardian', value: string | boolean) => {
    setStudentLinks((prev) => {
      if (field === 'is_primary_guardian' && value === true) {
        return prev.map((l) => ({ ...l, is_primary_guardian: l.student_id === studentId }));
      }
      return prev.map((l) => l.student_id === studentId ? { ...l, [field]: value } : l);
    });
  };

  const studentName = (id: string) => students.find((s) => s.id === id)?.full_name ?? 'Unknown';
  const studentClass = (id: string) => {
    const s = students.find((x) => x.id === id);
    if (!s?.class_id) return '—';
    return classes.find((c) => c.id === s.class_id)?.name ?? '—';
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('app_users').update({ full_name: form.full_name, phone: form.phone }).eq('id', editing.id);
      if (error) { setSaving(false); toast(error.message, 'error'); return; }
      toast('Updated.', 'success');
      setSaving(false);
      onSaved();
      return;
    }

    if (DEMO_MODE) {
      const slug = schoolSlugFromName(schoolName ?? 'school');
      const seq = Math.floor(Math.random() * 9000) + 1000;
      const email = demoEmailFor(role, form.full_name, slug, seq);
      const { error: demoErr } = await createDemoUser({
        role,
        fullName: form.full_name,
        schoolId,
        email,
        studentLinks: role === 'parent' && studentLinks.length > 0 ? studentLinks : undefined,
      });
      setSaving(false);
      if (demoErr) { toast(demoErr, 'error'); return; }
      onDemoCreated({
        email, password: DEMO_PASSWORD, fullName: form.full_name, role,
        schoolId, schoolName,
        studentName: role === 'parent' && studentLinks.length > 0 ? studentLinks.map((l) => studentName(l.student_id)).join(', ') : undefined,
      });
      return;
    }

    toast('Profile saved. Generate an invitation to activate their account.', 'success');
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit ${role}` : `Add ${role}`} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="staff-form" type="submit" loading={saving}>Save</Button></>}>
      <form id="staff-form" onSubmit={submit} className="space-y-4">
        <Input label="Full name" name="full_name" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
        <Input label="Phone number" name="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} leftIcon={<Phone className="h-4 w-4" />} placeholder="+254…" />

        {!editing && role === 'parent' && students.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ink dark:text-slate-100">Linked Students</label>
              <Button type="button" size="sm" variant="secondary" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setShowStudentPicker((v) => !v)}>{showStudentPicker ? 'Close' : 'Add Student'}</Button>
            </div>

            {showStudentPicker && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students by name or admission number…"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm text-ink dark:text-slate-100 focus:ring-2 focus:ring-primary-500/30 outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addStudentLink(s.id)}
                      disabled={studentLinks.some((l) => l.student_id === s.id)}
                      className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Avatar name={s.full_name} src={s.photo_url} size="sm" />
                      <div className="flex-1"><p className="font-medium text-ink dark:text-slate-100">{s.full_name}</p><p className="text-xs text-ink-muted">#{s.admission_number} · {studentClass(s.id)}</p></div>
                      {studentLinks.some((l) => l.student_id === s.id) && <Check className="h-4 w-4 text-success" />}
                    </button>
                  ))}
                  {filteredStudents.length === 0 && <p className="text-sm text-ink-muted py-2 text-center">No students found.</p>}
                </div>
              </div>
            )}

            {studentLinks.length > 0 && (
              <div className="space-y-2">
                {studentLinks.map((link) => (
                  <div key={link.student_id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={studentName(link.student_id)} size="sm" />
                        <div><p className="text-sm font-medium text-ink dark:text-slate-100">{studentName(link.student_id)}</p><p className="text-xs text-ink-muted">#{students.find((s) => s.id === link.student_id)?.admission_number}</p></div>
                      </div>
                      <button type="button" onClick={() => removeStudentLink(link.student_id)} className="text-ink-muted hover:text-error"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select label="Relationship" value={link.relationship} onChange={(e) => updateLink(link.student_id, 'relationship', e.target.value)}>
                        {relationshipOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </Select>
                      <label className="flex items-end gap-2 pb-2">
                        <input type="checkbox" checked={link.is_primary_guardian} onChange={(e) => updateLink(link.student_id, 'is_primary_guardian', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
                        <span className="text-sm text-ink-soft dark:text-slate-300">Primary Guardian</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!editing && (
          <p className="text-xs text-ink-muted rounded-xl bg-primary-50 dark:bg-primary-500/10 p-3">
            {DEMO_MODE
              ? 'A demo account will be created instantly with login credentials you can share.'
              : `After saving, generate an invitation link. The ${role} will create their password and their account will activate automatically.`}
          </p>
        )}
      </form>
    </Modal>
  );
}

function InviteModal({ open, person, role, link, copied, toast, onClose, onGenerate }: {
  open: boolean; person: AppUser | null; role: string; link: string | null; copied: boolean;
  toast: (m: string, t?: 'success' | 'error' | 'warning' | 'info') => void;
  onClose: () => void; onGenerate: (p: AppUser) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={`Invite ${role}`} description={person ? `Send an invitation to ${person.full_name}` : ''}>
      {link ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-500/10 p-4">
            <p className="text-sm text-ink-soft dark:text-slate-300 mb-2">This secure link expires in {INVITATION_EXPIRY_DAYS} days and works once.</p>
            <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5">
              <code className="text-xs text-ink dark:text-slate-200 flex-1 truncate">{link}</code>
              <button onClick={() => { navigator.clipboard.writeText(link); toast('Copied.', 'success'); }} className="shrink-0 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-ink-muted" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<Send className="h-4 w-4" />} className="flex-1" onClick={() => toast('Email queued (demo).', 'success')}>Email</Button>
            <Button variant="secondary" leftIcon={<Phone className="h-4 w-4" />} className="flex-1" onClick={() => toast('SMS queued (demo).', 'success')}>SMS</Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-ink-muted mb-4">No pending invitation.</p>
          {person && <Button onClick={() => onGenerate(person)} leftIcon={<Plus className="h-4 w-4" />}>Generate invitation</Button>}
        </div>
      )}
    </Modal>
  );
}

const RELATIONSHIP_OPTIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'other', label: 'Other' },
];

function ParentLinksModal({ open, parent, students, classes, schoolId, onClose, onChanged }: {
  open: boolean; parent: AppUser | null; students: Student[]; classes: ClassRow[];
  schoolId: string; onClose: () => void; onChanged: () => void;
}) {
  const { toast } = useToast();
  const [links, setLinks] = useState<Array<{ id: string; student_id: string; relationship: string; is_primary_guardian: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!parent) return;
    setLoading(true);
    supabase.from('student_parents').select('*').eq('parent_user_id', parent.user_id).then(({ data }) => {
      setLinks((data ?? []).map((r: any) => ({ id: r.id, student_id: r.student_id, relationship: r.relationship, is_primary_guardian: r.is_primary_guardian })));
      setLoading(false);
    });
    setSearch(''); setShowPicker(false);
  }, [parent]);

  const studentName = (id: string) => students.find((s) => s.id === id)?.full_name ?? 'Unknown';
  const studentClass = (id: string) => {
    const s = students.find((x) => x.id === id);
    if (!s?.class_id) return '—';
    return classes.find((c) => c.id === s.class_id)?.name ?? '—';
  };
  const studentAdm = (id: string) => students.find((s) => s.id === id)?.admission_number ?? '—';

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.full_name.toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q);
  });

  const addLink = async (studentId: string) => {
    if (links.some((l) => l.student_id === studentId)) return;
    const { data, error } = await supabase.from('student_parents').insert({
      school_id: schoolId, student_id: studentId, parent_user_id: parent?.user_id,
      relationship: 'guardian', is_primary_guardian: links.length === 0,
    }).select().single();
    if (error) { toast(error.message, 'error'); return; }
    setLinks((prev) => [...prev, { id: data.id, student_id: data.student_id, relationship: data.relationship, is_primary_guardian: data.is_primary_guardian }]);
    toast('Student linked.', 'success'); onChanged();
  };

  const removeLink = async (id: string) => {
    const { error } = await supabase.from('student_parents').delete().eq('id', id);
    if (error) { toast(error.message, 'error'); return; }
    setLinks((prev) => prev.filter((l) => l.id !== id));
    toast('Student unlinked.', 'success'); onChanged();
  };

  const updateLink = async (id: string, field: 'relationship' | 'is_primary_guardian', value: string | boolean) => {
    const patch: Record<string, string | boolean> = { [field]: value };
    if (field === 'is_primary_guardian' && value === true) {
      const others = links.filter((l) => l.id !== id);
      await Promise.all(others.map((l) => supabase.from('student_parents').update({ is_primary_guardian: false }).eq('id', l.id)));
      setLinks((prev) => prev.map((l) => ({ ...l, is_primary_guardian: l.id === id ? true : false })));
    } else {
      setLinks((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
    }
    await supabase.from('student_parents').update(patch).eq('id', id);
    onChanged();
  };

  if (!parent) return null;

  return (
    <Modal open={open} onClose={onClose} title={`${parent.full_name} — Linked Children`} size="lg"
      footer={<Button variant="secondary" onClick={onClose}>Done</Button>}>
      <div className="space-y-4">
        {loading ? <RowSkeleton /> : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink dark:text-slate-100">Linked Students ({links.length})</p>
              <Button size="sm" variant="secondary" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setShowPicker((v) => !v)}>{showPicker ? 'Close' : 'Add Student'}</Button>
            </div>

            {showPicker && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…" className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm text-ink dark:text-slate-100 focus:ring-2 focus:ring-primary-500/30 outline-none" />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filtered.map((s) => (
                    <button key={s.id} type="button" onClick={() => addLink(s.id)} disabled={links.some((l) => l.student_id === s.id)} className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <Avatar name={s.full_name} src={s.photo_url} size="sm" />
                      <div className="flex-1"><p className="font-medium text-ink dark:text-slate-100">{s.full_name}</p><p className="text-xs text-ink-muted">#{s.admission_number} · {studentClass(s.id)}</p></div>
                      {links.some((l) => l.student_id === s.id) && <Check className="h-4 w-4 text-success" />}
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="text-sm text-ink-muted py-2 text-center">No students found.</p>}
                </div>
              </div>
            )}

            {links.length > 0 ? (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={studentName(link.student_id)} size="sm" />
                        <div><p className="text-sm font-medium text-ink dark:text-slate-100">{studentName(link.student_id)}</p><p className="text-xs text-ink-muted">#{studentAdm(link.student_id)} · {studentClass(link.student_id)}</p></div>
                      </div>
                      <button onClick={() => removeLink(link.id)} className="text-ink-muted hover:text-error"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={link.relationship} onChange={(e) => updateLink(link.id, 'relationship', e.target.value)}>
                        {RELATIONSHIP_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </Select>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={link.is_primary_guardian} onChange={(e) => updateLink(link.id, 'is_primary_guardian', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
                        <span className="text-sm text-ink-soft dark:text-slate-300">Primary Guardian</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted py-4 text-center">No students linked yet. Click "Add Student" to link children.</p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

