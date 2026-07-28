import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { RowSkeleton, CardSkeleton } from '@/components/ui/Spinner';
import { LayoutDashboard, Building2, GraduationCap, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { School } from '@/types';

export function SuperAdminDashboard() {
  const { profile } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sRes, uRes, stRes] = await Promise.all([
        supabase.from('schools').select('*').order('created_at', { ascending: false }),
        supabase.from('app_users').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
      ]);
      setSchools((sRes.data as School[]) ?? []);
      setTotalUsers(uRes.count ?? 0);
      setTotalStudents(stRes.count ?? 0);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(' ')[0] ?? 'Owner'}`}
        subtitle="EduBridge Platform Overview"
        icon={<LayoutDashboard className="h-6 w-6" />}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Schools" value={schools.length} icon={<Building2 className="h-6 w-6 text-primary-light" />} accent="bg-primary-soft" />
          <StatCard label="Total Users" value={totalUsers} icon={<Users className="h-6 w-6 text-success-soft-text" />} accent="bg-success-soft" />
          <StatCard label="Total Students" value={totalStudents} icon={<GraduationCap className="h-6 w-6 text-warning-soft-text" />} accent="bg-warning-soft" />
          <StatCard label="Active Schools" value={schools.filter((s) => s.status === 'active').length} icon={<Building2 className="h-6 w-6 text-info-soft-text" />} accent="bg-info-soft" />
        </div>
      )}

      <Card className="mt-6">
        <CardHeader title="Registered Schools" subtitle="All schools on the platform" />
        {loading ? (
          <RowSkeleton rows={4} />
        ) : schools.length === 0 ? (
          <p className="text-sm text-ink-muted py-4 text-center">No schools registered yet.</p>
        ) : (
          <div className="space-y-2">
            {schools.map((s) => {
              const b = statusBadge(s.status);
              return (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-surface-overlay px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-light">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-ink-muted">{s.email ?? 'No email'} · {formatDate(s.created_at)}</p>
                    </div>
                  </div>
                  <Badge variant={b.variant}>{b.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
