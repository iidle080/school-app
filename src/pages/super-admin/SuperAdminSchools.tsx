import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Plus, Mail, Phone, MapPin, User, Send, Copy, Check, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { RowSkeleton } from '@/components/ui/Spinner';
import { generateToken, daysFromNow, formatDate } from '@/lib/utils';
import { PLAN_LABELS, INVITATION_EXPIRY_DAYS, SCHOOL_STATUS_LABELS } from '@/lib/constants';
import type { School, SchoolStatus, Invitation } from '@/types';

export function SuperAdminSchools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState<School | null>(null);
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [deleteSchool, setDeleteSchool] = useState<School | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, inv] = await Promise.all([
      supabase.from('schools').select('*').order('created_at', { ascending: false }),
      supabase.from('invitations').select('*').eq('role', 'school_admin').order('created_at', { ascending: false }),
    ]);
    setSchools((s.data as School[]) ?? []);
    setInvitations((inv.data as Invitation[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const inviteForSchool = (schoolId: string) => invitations.find((i) => i.school_id === schoolId && i.status === 'pending');

  const confirmDelete = async () => {
    if (!deleteSchool) return;
    setDeleting(true);
    const { error } = await supabase.from('schools').delete().eq('id', deleteSchool.id);
    setDeleting(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(`${deleteSchool.name} has been deleted.`, 'success');
    setDeleteSchool(null);
    load();
  };

  const columns: Column<School>[] = [
    {
      key: 'name', header: 'School',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 font-semibold text-sm dark:bg-primary-500/15 dark:text-primary-light">
            {s.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-ink dark:text-slate-100">{s.name}</p>
            <p className="text-xs text-ink-muted">{s.email ?? 'No email'}</p>
          </div>
        </div>
      ),
    },
    { key: 'principal', header: 'Principal', render: (s) => <span className="text-ink-soft dark:text-slate-300">{s.principal_name ?? '—'}</span> },
    { key: 'admin', header: 'Admin', render: (s) => <span className="text-ink-soft dark:text-slate-300">{s.admin_name ?? '—'}</span> },
    {
      key: 'status', header: 'Status',
      render: (s) => { const b = statusBadge(s.status); return <Badge variant={b.variant}>{b.label}</Badge>; },
    },
    { key: 'created', header: 'Created', render: (s) => <span className="text-ink-muted text-xs">{formatDate(s.created_at)}</span> },
    {
      key: 'actions', header: '',
      render: (s) => {
        const inv = inviteForSchool(s.id);
        return (
          <div className="flex items-center justify-end gap-2">
            {inv ? (
              <Button size="sm" variant="secondary" onClick={() => { setShowInvite(s); setCreatedLink(`${window.location.origin}/invite/${inv.token}`); }}>
                View Invite
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setShowInvite(s)}>Invite Admin</Button>
            )}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id); }}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-800 transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpenId === s.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                  <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1">
                    <button
                      onClick={() => { setMenuOpenId(null); setEditSchool(s); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => { setMenuOpenId(null); setDeleteSchool(s); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Schools"
        subtitle="Create and manage schools on the platform."
        icon={<Building2 className="h-5 w-5" />}
        action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Add School</Button>}
      />

      {loading ? <RowSkeleton /> : (
        <Card>
          <DataTable
            columns={columns}
            data={schools}
            rowKey={(s) => s.id}
            searchKeys={['name', 'email', 'principal_name', 'admin_name']}
            searchPlaceholder="Search schools…"
            emptyTitle="No schools yet"
            emptyDescription="Create your first school to get started."
          />
        </Card>
      )}

      <CreateSchoolModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(school, link) => { setShowCreate(false); setShowInvite(school); setCreatedLink(link); load(); }}
        userId={user?.id ?? ''}
      />

      <EditSchoolModal
        open={!!editSchool}
        school={editSchool}
        onClose={() => setEditSchool(null)}
        onSaved={() => { setEditSchool(null); load(); }}
      />

      <DeleteSchoolModal
        open={!!deleteSchool}
        school={deleteSchool}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteSchool(null)}
      />

      <InviteLinkModal
        open={!!showInvite}
        school={showInvite}
        link={createdLink}
        copied={copied}
        toast={toast}
        onCopy={() => {
          if (createdLink) { navigator.clipboard.writeText(createdLink); setCopied(true); toast('Link copied to clipboard.', 'success'); setTimeout(() => setCopied(false), 2000); }
        }}
        onClose={() => { setShowInvite(null); setCreatedLink(null); setCopied(false); }}
        onGenerate={async (school) => {
          if (!user) return;
          const token = generateToken();
          const { data, error } = await supabase.from('invitations').insert({
            school_id: school.id,
            token,
            role: 'school_admin',
            email: school.admin_email,
            full_name: school.admin_name,
            status: 'pending',
            channel: 'email',
            expires_at: daysFromNow(INVITATION_EXPIRY_DAYS),
            created_by: user.id,
          }).select().single();
          if (error) { toast(error.message, 'error'); return; }
          const link = `${window.location.origin}/invite/${token}`;
          setCreatedLink(link);
          toast('Invitation generated.', 'success');
          load();
        }}
      />
    </div>
  );
}

function CreateSchoolModal({ open, onClose, onCreated, userId }: { open: boolean; onClose: () => void; onCreated: (s: School, link: string) => void; userId: string }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', address: '', email: '', phone: '', principal: '', adminName: '', adminEmail: '', adminPhone: '', plan: 'starter' });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: school, error } = await supabase.from('schools').insert({
      name: form.name, address: form.address, email: form.email, phone: form.phone,
      principal_name: form.principal, admin_name: form.adminName, admin_email: form.adminEmail, admin_phone: form.adminPhone,
      status: 'pending',
    }).select().single();
    if (error) { setSaving(false); toast(error.message, 'error'); return; }

    await supabase.from('subscriptions').insert({ school_id: school.id, plan: form.plan, status: 'trial', trial_ends_at: daysFromNow(14) });

    const token = generateToken();
    await supabase.from('invitations').insert({
      school_id: school.id, token, role: 'school_admin', email: form.adminEmail, full_name: form.adminName,
      status: 'pending', channel: 'email', expires_at: daysFromNow(INVITATION_EXPIRY_DAYS), created_by: userId,
    });

    setSaving(false);
    setForm({ name: '', address: '', email: '', phone: '', principal: '', adminName: '', adminEmail: '', adminPhone: '', plan: 'starter' });
    onCreated(school as School, `${window.location.origin}/invite/${token}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a new school" description="Enter the school details. An invitation link will be generated for the school admin." size="lg" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="create-school-form" type="submit" loading={saving}>Create & generate invite</Button></>}>
      <form id="create-school-form" onSubmit={submit} className="space-y-4">
        <Input label="School name" name="name" required value={form.name} onChange={set('name')} placeholder="Greenfield Academy" />
        <Input label="Address" name="address" value={form.address} onChange={set('address')} leftIcon={<MapPin className="h-4 w-4" />} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="School email" name="email" type="email" value={form.email} onChange={set('email')} leftIcon={<Mail className="h-4 w-4" />} />
          <Input label="School phone" name="phone" value={form.phone} onChange={set('phone')} leftIcon={<Phone className="h-4 w-4" />} />
        </div>
        <Input label="Principal name" name="principal" value={form.principal} onChange={set('principal')} leftIcon={<User className="h-4 w-4" />} />
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
          <p className="text-sm font-semibold text-ink dark:text-slate-100 mb-3">School Administrator</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Admin name" name="adminName" required value={form.adminName} onChange={set('adminName')} />
            <Input label="Admin email" name="adminEmail" type="email" required value={form.adminEmail} onChange={set('adminEmail')} />
            <Input label="Admin phone" name="adminPhone" value={form.adminPhone} onChange={set('adminPhone')} />
            <Select label="Subscription plan" value={form.plan} onChange={set('plan')}>
              {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function EditSchoolModal({ open, school, onClose, onSaved }: { open: boolean; school: School | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', address: '', email: '', phone: '', principal: '', adminName: '', adminEmail: '', adminPhone: '', status: 'pending' as SchoolStatus });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name ?? '',
        address: school.address ?? '',
        email: school.email ?? '',
        phone: school.phone ?? '',
        principal: school.principal_name ?? '',
        adminName: school.admin_name ?? '',
        adminEmail: school.admin_email ?? '',
        adminPhone: school.admin_phone ?? '',
        status: school.status ?? 'pending',
      });
    }
  }, [school]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    const { error } = await supabase.from('schools').update({
      name: form.name,
      address: form.address || null,
      email: form.email || null,
      phone: form.phone || null,
      principal_name: form.principal || null,
      admin_name: form.adminName || null,
      admin_email: form.adminEmail || null,
      admin_phone: form.adminPhone || null,
      status: form.status,
    }).eq('id', school.id);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('School updated successfully.', 'success');
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit school" description={school ? `Update details for ${school.name}` : ''} size="lg" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="edit-school-form" type="submit" loading={saving}>Save changes</Button></>}>
      <form id="edit-school-form" onSubmit={submit} className="space-y-4">
        <Input label="School name" name="name" required value={form.name} onChange={set('name')} placeholder="Greenfield Academy" />
        <Input label="Address" name="address" value={form.address} onChange={set('address')} leftIcon={<MapPin className="h-4 w-4" />} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="School email" name="email" type="email" value={form.email} onChange={set('email')} leftIcon={<Mail className="h-4 w-4" />} />
          <Input label="School phone" name="phone" value={form.phone} onChange={set('phone')} leftIcon={<Phone className="h-4 w-4" />} />
        </div>
        <Input label="Principal name" name="principal" value={form.principal} onChange={set('principal')} leftIcon={<User className="h-4 w-4" />} />
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
          <p className="text-sm font-semibold text-ink dark:text-slate-100 mb-3">School Administrator</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Admin name" name="adminName" value={form.adminName} onChange={set('adminName')} />
            <Input label="Admin email" name="adminEmail" type="email" value={form.adminEmail} onChange={set('adminEmail')} />
            <Input label="Admin phone" name="adminPhone" value={form.adminPhone} onChange={set('adminPhone')} />
            <Select label="Status" value={form.status} onChange={set('status')}>
              {Object.entries(SCHOOL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function DeleteSchoolModal({ open, school, loading, onConfirm, onClose }: { open: boolean; school: School | null; loading: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Delete school" size="sm" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" loading={loading} onClick={onConfirm}>Delete school</Button></>}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-error/10 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error/15 text-error">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-ink dark:text-slate-100">Delete {school?.name}?</p>
            <p className="text-sm text-ink-muted mt-0.5">This will permanently remove the school and all its data — students, staff, classes, records, and invitations. This cannot be undone.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function InviteLinkModal({ open, school, link, copied, toast, onClose, onCopy, onGenerate }: {
  open: boolean; school: School | null; link: string | null; copied: boolean;
  toast: (m: string, t?: 'success' | 'error' | 'warning' | 'info') => void;
  onClose: () => void; onCopy: () => void; onGenerate: (s: School) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="School admin invitation" description={school ? `Invite an administrator for ${school.name}` : ''}>
      {link ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-500/10 p-4">
            <p className="text-sm text-ink-soft dark:text-slate-300 mb-2">Send this secure link to the school admin. It expires in {INVITATION_EXPIRY_DAYS} days and works once.</p>
            <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5">
              <code className="text-xs text-ink dark:text-slate-200 flex-1 truncate">{link}</code>
              <button onClick={onCopy} className="shrink-0 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-ink-muted" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<Send className="h-4 w-4" />} className="flex-1" onClick={() => { toast('Invitation email queued (demo).', 'success'); }}>Send by Email</Button>
            <Button variant="secondary" leftIcon={<Phone className="h-4 w-4" />} className="flex-1" onClick={() => { toast('Invitation SMS queued (demo).', 'success'); }}>Send by SMS</Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-ink-muted mb-4">No pending invitation for this school.</p>
          {school && <Button onClick={() => onGenerate(school)} leftIcon={<Plus className="h-4 w-4" />}>Generate invitation</Button>}
        </div>
      )}
    </Modal>
  );
}
