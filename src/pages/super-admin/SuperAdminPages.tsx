import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { RowSkeleton, EmptyState } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PLAN_LABELS } from '@/lib/constants';
import { CreditCard, BarChart3, Users, ScrollText, LifeBuoy, Settings, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';
import type { Subscription, AppUser, AuditLog, School } from '@/types';

// ───────────────────────── Subscriptions ─────────────────────────

export function SuperAdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [schools, setSchools] = useState<Record<string, School>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, sc] = await Promise.all([
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('schools').select('*'),
      ]);
      setSubs((s.data as Subscription[]) ?? []);
      const map: Record<string, School> = {};
      (sc.data as School[])?.forEach((x) => { map[x.id] = x; });
      setSchools(map);
      setLoading(false);
    })();
  }, []);

  const columns: Column<Subscription>[] = [
    { key: 'school', header: 'School', render: (s) => <span className="font-medium text-ink dark:text-slate-100">{schools[s.school_id]?.name ?? '—'}</span> },
    { key: 'plan', header: 'Plan', render: (s) => <Badge variant="primary">{PLAN_LABELS[s.plan]}</Badge> },
    { key: 'status', header: 'Status', render: (s) => { const b = statusBadge(s.status); return <Badge variant={b.variant}>{b.label}</Badge>; } },
    { key: 'seats', header: 'Seats', render: (s) => s.seats },
    { key: 'amount', header: 'Amount', render: (s) => formatCurrency(s.amount, s.currency) },
    { key: 'cycle', header: 'Cycle', render: (s) => <span className="capitalize">{s.billing_cycle}</span> },
    { key: 'renews', header: 'Renews', render: (s) => <span className="text-xs text-ink-muted">{formatDate(s.renews_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Manage billing and subscription plans across all schools." icon={<CreditCard className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : (
        <Card>
          <DataTable columns={columns} data={subs} rowKey={(s) => s.id} searchKeys={[]} emptyTitle="No subscriptions" />
        </Card>
      )}
    </div>
  );
}

// ───────────────────────── Analytics ─────────────────────────

export function SuperAdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ schools: 0, students: 0, teachers: 0, parents: 0, active: 0, trial: 0 });

  useEffect(() => {
    (async () => {
      const [sc, st, t, p, ac, tr] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('app_users').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('app_users').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
        supabase.from('schools').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'trial'),
      ]);
      setStats({ schools: sc.count ?? 0, students: st.count ?? 0, teachers: t.count ?? 0, parents: p.count ?? 0, active: ac.count ?? 0, trial: tr.count ?? 0 });
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Platform-wide growth and engagement metrics." icon={<BarChart3 className="h-5 w-5" />} />
      {loading ? <RowSkeleton count={3} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card><CardHeader title="Total Schools" /><p className="text-3xl font-bold text-ink dark:text-slate-100">{stats.schools}</p><p className="text-sm text-ink-muted mt-1">{stats.active} active</p></Card>
          <Card><CardHeader title="Total Students" /><p className="text-3xl font-bold text-ink dark:text-slate-100">{stats.students}</p></Card>
          <Card><CardHeader title="Total Teachers" /><p className="text-3xl font-bold text-ink dark:text-slate-100">{stats.teachers}</p></Card>
          <Card><CardHeader title="Total Parents" /><p className="text-3xl font-bold text-ink dark:text-slate-100">{stats.parents}</p></Card>
          <Card><CardHeader title="Active Schools" /><p className="text-3xl font-bold text-success-dark">{stats.active}</p></Card>
          <Card><CardHeader title="On Trial" /><p className="text-3xl font-bold text-primary-600">{stats.trial}</p></Card>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Platform Users ─────────────────────────

export function SuperAdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('app_users').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers((data as AppUser[]) ?? []);
      setLoading(false);
    });
  }, []);

  const columns: Column<AppUser>[] = [
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium text-ink dark:text-slate-100">{u.full_name}</span> },
    { key: 'role', header: 'Role', render: (u) => <Badge variant="primary">{u.role.replace('_', ' ')}</Badge> },
    { key: 'phone', header: 'Phone', render: (u) => <span className="text-ink-muted">{u.phone ?? '—'}</span> },
    { key: 'active', header: 'Status', render: (u) => u.active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Disabled</Badge> },
    { key: 'joined', header: 'Joined', render: (u) => <span className="text-xs text-ink-muted">{formatDate(u.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Platform Users" subtitle="All users across every school on the platform." icon={<Users className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : (
        <Card>
          <DataTable columns={columns} data={users} rowKey={(u) => u.id} searchKeys={['full_name', 'phone']} searchPlaceholder="Search users…" emptyTitle="No users yet" />
        </Card>
      )}
    </div>
  );
}

// ───────────────────────── Audit Logs ─────────────────────────

export function SuperAdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => {
      setLogs((data as AuditLog[]) ?? []);
      setLoading(false);
    });
  }, []);

  const columns: Column<AuditLog>[] = [
    { key: 'action', header: 'Action', render: (l) => <span className="font-medium text-ink dark:text-slate-100">{l.action}</span> },
    { key: 'entity', header: 'Entity', render: (l) => <span className="text-ink-muted">{l.entity ?? '—'}</span> },
    { key: 'role', header: 'Role', render: (l) => <Badge variant="neutral">{l.actor_role ?? '—'}</Badge> },
    { key: 'time', header: 'Time', render: (l) => <span className="text-xs text-ink-muted">{formatDate(l.created_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="A complete trail of actions across the platform." icon={<ScrollText className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : (
        <Card>
          <DataTable columns={columns} data={logs} rowKey={(l) => l.id} searchKeys={['action', 'entity']} searchPlaceholder="Search logs…" emptyTitle="No audit entries" />
        </Card>
      )}
    </div>
  );
}

// ───────────────────────── Support ─────────────────────────

export function SuperAdminSupport() {
  return (
    <div>
      <PageHeader title="Support" subtitle="Help resources for platform administrators." icon={<LifeBuoy className="h-5 w-5" />} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card hover><CardHeader title="Documentation" subtitle="Platform guides and API references" /><TrendingUp className="h-8 w-8 text-primary" /></Card>
        <Card hover><CardHeader title="System Status" subtitle="All systems operational" /><Activity className="h-8 w-8 text-success" /></Card>
        <Card hover><CardHeader title="Contact Engineering" subtitle="Reach the core team directly" /><CheckCircle2 className="h-8 w-8 text-warning" /></Card>
      </div>
    </div>
  );
}

// ───────────────────────── System Settings ─────────────────────────

export function SuperAdminSettings() {
  return (
    <div>
      <PageHeader title="System Settings" subtitle="Configure platform-wide preferences." icon={<Settings className="h-5 w-5" />} />
      <div className="max-w-2xl space-y-4">
        <Card><CardHeader title="Platform Name" subtitle="Displayed across the application" /><p className="text-sm text-ink-soft dark:text-slate-300">EduBridge</p></Card>
        <Card><CardHeader title="Invitation Expiry" subtitle="How long invitation links remain valid" /><p className="text-sm text-ink-soft dark:text-slate-300">7 days</p></Card>
        <Card><CardHeader title="Default Currency" subtitle="Used for subscription billing" /><p className="text-sm text-ink-soft dark:text-slate-300">KES (Kenyan Shilling)</p></Card>
      </div>
    </div>
  );
}
