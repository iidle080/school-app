import { useEffect, useState } from 'react';
import { Building2, GraduationCap, Users, UsersRound, CreditCard, Server, TrendingUp, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, relativeTime } from '@/lib/utils';
import type { School, Subscription, AuditLog } from '@/types';

export function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [totals, setTotals] = useState({ students: 0, teachers: 0, parents: 0 });
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    (async () => {
      const [s, sub, stu, tch, par, lg] = await Promise.all([
        supabase.from('schools').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*'),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('app_users').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('app_users').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8),
      ]);
      setSchools((s.data as School[]) ?? []);
      setSubs((sub.data as Subscription[]) ?? []);
      setTotals({
        students: stu.count ?? 0,
        teachers: tch.count ?? 0,
        parents: par.count ?? 0,
      });
      setLogs((lg.data as AuditLog[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const monthlyRevenue = subs
    .filter((s) => s.status === 'active' || s.status === 'trial')
    .reduce((sum, s) => {
      const monthly = s.billing_cycle === 'monthly' ? s.amount : s.amount / 12;
      return sum + monthly;
    }, 0);

  const activeSchools = schools.filter((s) => s.status === 'active').length;

  return (
    <div>
      <PageHeader
        title="Platform Overview"
        subtitle="Monitor your EduBridge platform health and growth."
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="Total Schools" value={schools.length} icon={<Building2 className="h-5 w-5" />} trend={{ value: `${activeSchools} active`, positive: true }} />
            <StatCard label="Total Students" value={totals.students} icon={<GraduationCap className="h-5 w-5" />} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
            <StatCard label="Total Teachers" value={totals.teachers} icon={<Users className="h-5 w-5" />} accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
            <StatCard label="Total Parents" value={totals.parents} icon={<UsersRound className="h-5 w-5" />} accent="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <StatCard label="Monthly Revenue" value={formatCurrency(monthlyRevenue)} icon={<CreditCard className="h-5 w-5" />} trend={{ value: 'Recurring', positive: true }} />
            <StatCard label="Active Subscriptions" value={subs.filter((s) => s.status === 'active').length} icon={<TrendingUp className="h-5 w-5" />} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
            <StatCard label="Server Status" value="Operational" icon={<Server className="h-5 w-5" />} accent="bg-success-bg text-success-dark" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Recent Schools" subtitle="Latest schools onboarded" action={<Link to="/super-admin/schools" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>} />
              <div className="space-y-2">
                {schools.slice(0, 5).map((s) => {
                  const b = statusBadge(s.status);
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 font-semibold text-sm dark:bg-primary-500/15 dark:text-primary-light">
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink dark:text-slate-100 truncate">{s.name}</p>
                        <p className="text-xs text-ink-muted">Joined {formatDate(s.created_at)}</p>
                      </div>
                      <Badge variant={b.variant}>{b.label}</Badge>
                    </div>
                  );
                })}
                {schools.length === 0 && <p className="text-sm text-ink-muted py-6 text-center">No schools yet. Create your first school.</p>}
              </div>
            </Card>

            <Card>
              <CardHeader title="Activity Feed" subtitle="Latest platform events" />
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-ink-muted py-6 text-center">No recent activity.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <ArrowUpRight className="h-4 w-4 text-ink-muted" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-ink dark:text-slate-200 truncate">{log.action}</p>
                        <p className="text-xs text-ink-muted">{relativeTime(log.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
