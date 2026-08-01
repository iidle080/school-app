import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { RowSkeleton, CardSkeleton } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Building2, Search, Ban, CircleCheck as CheckCircle2, Eye, Phone, Mail, MapPin, Users, GraduationCap, UserCog } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { School } from '@/types';

interface SchoolWithCounts extends School {
  student_count: number;
  teacher_count: number;
  parent_count: number;
  plan: string | null;
  sub_status: string | null;
}

export function SuperAdminSchools() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailSchool, setDetailSchool] = useState<SchoolWithCounts | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSchools = useCallback(async () => {
    setLoading(true);
    const { data: allSchools } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    const schoolList = (allSchools as School[]) ?? [];

    const schoolIds = schoolList.map((s) => s.id);
    if (schoolIds.length === 0) {
      setSchools([]);
      setLoading(false);
      return;
    }

    const [sc, tc, pc, subs] = await Promise.all([
      supabase.from('students').select('school_id').in('school_id', schoolIds),
      supabase.from('app_users').select('school_id').eq('role', 'teacher').in('school_id', schoolIds),
      supabase.from('app_users').select('school_id').eq('role', 'parent').in('school_id', schoolIds),
      supabase.from('subscriptions').select('school_id, plan, status').in('school_id', schoolIds),
    ]);

    const studentCounts: Record<string, number> = {};
    (sc.data ?? []).forEach((r: { school_id: string }) => { studentCounts[r.school_id] = (studentCounts[r.school_id] ?? 0) + 1; });
    const teacherCounts: Record<string, number> = {};
    (tc.data ?? []).forEach((r: { school_id: string }) => { teacherCounts[r.school_id] = (teacherCounts[r.school_id] ?? 0) + 1; });
    const parentCounts: Record<string, number> = {};
    (pc.data ?? []).forEach((r: { school_id: string }) => { parentCounts[r.school_id] = (parentCounts[r.school_id] ?? 0) + 1; });
    const subMap: Record<string, { plan: string; status: string }> = {};
    (subs.data ?? []).forEach((r: { school_id: string; plan: string; status: string }) => {
      subMap[r.school_id] = { plan: r.plan, status: r.status };
    });

    setSchools(schoolList.map((s) => ({
      ...s,
      student_count: studentCounts[s.id] ?? 0,
      teacher_count: teacherCounts[s.id] ?? 0,
      parent_count: parentCounts[s.id] ?? 0,
      plan: subMap[s.id]?.plan ?? null,
      sub_status: subMap[s.id]?.status ?? null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  const filteredSchools = useMemo(() => {
    let list = schools;
    if (statusFilter !== 'all') list = list.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.admin_name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [schools, search, statusFilter]);

  const toggleSchoolStatus = async (school: SchoolWithCounts) => {
    setActionLoading(true);
    const newStatus = school.status === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase.from('schools').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', school.id);
    if (error) {
      toast(`Failed to update school status: ${error.message}`, 'error');
    } else {
      toast(`${school.name} ${newStatus === 'suspended' ? 'suspended' : 'activated'}`, 'success');
      setSchools((prev) => prev.map((s) => s.id === school.id ? { ...s, status: newStatus } : s));
      setDetailSchool((prev) => prev?.id === school.id ? { ...prev, status: newStatus } : prev);
    }
    setActionLoading(false);
  };

  const stats = useMemo(() => ({
    total: schools.length,
    active: schools.filter((s) => s.status === 'active').length,
    suspended: schools.filter((s) => s.status === 'suspended').length,
    pending: schools.filter((s) => s.status === 'pending').length,
  }), [schools]);

  return (
    <div>
      <PageHeader
        title="Schools"
        subtitle="Manage all schools on the platform"
        icon={<Building2 className="h-6 w-6" />}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-ink">{stats.total}</p>
          <p className="text-xs text-ink-muted mt-1">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-success-soft-text">{stats.active}</p>
          <p className="text-xs text-ink-muted mt-1">Active</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-warning-soft-text">{stats.pending}</p>
          <p className="text-xs text-ink-muted mt-1">Trial</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-error-soft-text">{stats.suspended}</p>
          <p className="text-xs text-ink-muted mt-1">Suspended</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="All Schools"
          subtitle={`${filteredSchools.length} school${filteredSchools.length !== 1 ? 's' : ''}`}
          action={
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input text-sm py-1.5 px-2">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Trial</option>
              <option value="suspended">Suspended</option>
            </select>
          }
        />
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input className="input text-sm pl-9" placeholder="Search by name, email, or admin…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <RowSkeleton rows={5} />
        ) : filteredSchools.length === 0 ? (
          <EmptyState title="No schools found" description="Try adjusting your search or filters." icon={<Building2 className="h-10 w-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-ink-muted">
                  <th className="pb-2 pr-4 font-medium">School</th>
                  <th className="pb-2 pr-4 font-medium text-center">Students</th>
                  <th className="pb-2 pr-4 font-medium text-center">Staff</th>
                  <th className="pb-2 pr-4 font-medium text-center">Parents</th>
                  <th className="pb-2 pr-4 font-medium">Plan</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Joined</th>
                  <th className="pb-2 pr-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSchools.map((s) => {
                  const b = statusBadge(s.status === 'pending' ? 'scheduled' : s.status);
                  return (
                    <tr key={s.id} className="text-ink-soft dark:text-slate-300">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-light">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink dark:text-slate-100">{s.name}</p>
                            <p className="truncate text-xs text-ink-muted">{s.email ?? 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-center font-medium">{s.student_count}</td>
                      <td className="py-3 pr-4 text-center font-medium">{s.teacher_count}</td>
                      <td className="py-3 pr-4 text-center font-medium">{s.parent_count}</td>
                      <td className="py-3 pr-4"><span className="capitalize text-xs">{s.plan ?? '—'}</span></td>
                      <td className="py-3 pr-4"><Badge variant={b.variant}>{b.label}</Badge></td>
                      <td className="py-3 pr-4 text-xs text-ink-muted">{formatDate(s.created_at)}</td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setDetailSchool(s)} className="rounded-lg p-1.5 transition-colors hover:bg-surface-overlay text-ink-muted" title="View details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleSchoolStatus(s)}
                            disabled={actionLoading}
                            className={cn('rounded-lg p-1.5 transition-colors', s.status === 'suspended' ? 'text-success-soft-text hover:bg-success-soft' : 'text-error-soft-text hover:bg-error-soft')}
                            title={s.status === 'suspended' ? 'Activate' : 'Suspend'}
                          >
                            {s.status === 'suspended' ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!detailSchool}
        onClose={() => setDetailSchool(null)}
        title={detailSchool?.name ?? 'School Details'}
        description="School overview and management"
        size="lg"
        footer={
          detailSchool && (
            <Button
              variant={detailSchool.status === 'suspended' ? 'success' : 'danger'}
              onClick={() => toggleSchoolStatus(detailSchool)}
              loading={actionLoading}
              leftIcon={detailSchool.status === 'suspended' ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            >
              {detailSchool.status === 'suspended' ? 'Activate School' : 'Suspend School'}
            </Button>
          )
        }
      >
        {detailSchool && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-primary-soft p-4 text-center">
                <GraduationCap className="h-5 w-5 mx-auto text-primary-light mb-1" />
                <p className="text-2xl font-bold text-ink">{detailSchool.student_count}</p>
                <p className="text-xs text-ink-muted">Students</p>
              </div>
              <div className="rounded-xl bg-success-soft p-4 text-center">
                <UserCog className="h-5 w-5 mx-auto text-success-soft-text mb-1" />
                <p className="text-2xl font-bold text-ink">{detailSchool.teacher_count}</p>
                <p className="text-xs text-ink-muted">Staff</p>
              </div>
              <div className="rounded-xl bg-warning-soft p-4 text-center">
                <Users className="h-5 w-5 mx-auto text-warning-soft-text mb-1" />
                <p className="text-2xl font-bold text-ink">{detailSchool.parent_count}</p>
                <p className="text-xs text-ink-muted">Parents</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-ink-muted" />
                <span className="text-ink-muted">Email:</span>
                <span className="text-ink">{detailSchool.email ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-ink-muted" />
                <span className="text-ink-muted">Phone:</span>
                <span className="text-ink">{detailSchool.phone ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-ink-muted" />
                <span className="text-ink-muted">Address:</span>
                <span className="text-ink">{detailSchool.address ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-ink-muted" />
                <span className="text-ink-muted">Principal:</span>
                <span className="text-ink">{detailSchool.principal_name ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-ink-muted" />
                <span className="text-ink-muted">Admin:</span>
                <span className="text-ink">{detailSchool.admin_name ?? '—'} ({detailSchool.admin_email ?? '—'})</span>
              </div>
            </div>

            <div className="rounded-xl border border-surface-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Subscription Plan</span>
                <span className="capitalize font-medium text-ink">{detailSchool.plan ?? 'No subscription'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Subscription Status</span>
                <Badge variant={detailSchool.sub_status === 'active' ? 'success' : 'secondary'}>{detailSchool.sub_status ?? 'None'}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">School Status</span>
                <Badge variant={statusBadge(detailSchool.status === 'pending' ? 'scheduled' : detailSchool.status).variant}>
                  {detailSchool.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Joined</span>
                <span className="text-ink">{formatDate(detailSchool.created_at)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
