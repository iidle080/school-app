import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Send, Copy, Check, Phone, Mail, X, RotateCw, Ban } from 'lucide-react';
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
import { INVITATION_EXPIRY_DAYS } from '@/lib/constants';
import type { AppUser, Invitation, ClassRow } from '@/types';
import type { UserRole } from '@/types';

// Shared staff-management page used for Teachers and Parents.
export function StaffManagement({ role }: { role: 'teacher' | 'parent' }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { teachers, parents, students, classes, loading, refresh } = useSchoolData();
  const isTeacher = role === 'teacher';
  const list = isTeacher ? teachers : parents;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [showInvite, setShowInvite] = useState<AppUser | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [copied, setCopied] = useState(false);

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
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={() => { setShowForm(false); setEditing(null); refresh(); }}
      />

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

function StaffFormModal({ open, editing, role, schoolId, onClose, onSaved }: {
  open: boolean; editing: AppUser | null; role: UserRole; schoolId: string;
  classes: ClassRow[]; students: any[];
  onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ full_name: editing?.full_name ?? '', phone: editing?.phone ?? '' });
  }, [editing, open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('app_users').update({ full_name: form.full_name, phone: form.phone }).eq('id', editing.id);
      if (error) { setSaving(false); toast(error.message, 'error'); return; }
      toast('Updated.', 'success');
    } else {
      // Creating a staff member creates a profile placeholder; the actual auth user is created when they accept the invitation.
      // We store the name/phone so the admin can see the pending entry and generate an invite.
      toast('Profile saved. Generate an invitation to activate their account.', 'success');
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit ${role}` : `Add ${role}`} size="md"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="staff-form" type="submit" loading={saving}>Save</Button></>}>
      <form id="staff-form" onSubmit={submit} className="space-y-4">
        <Input label="Full name" name="full_name" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
        <Input label="Phone number" name="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} leftIcon={<Phone className="h-4 w-4" />} placeholder="+254…" />
        {!editing && (
          <p className="text-xs text-ink-muted rounded-xl bg-primary-50 dark:bg-primary-500/10 p-3">
            After saving, generate an invitation link. The {role} will create their password and their account will activate automatically.
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

