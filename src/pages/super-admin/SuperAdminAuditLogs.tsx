import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RowSkeleton } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScrollText, Search, Activity } from 'lucide-react';
import { relativeTime } from '@/lib/utils';
import type { School } from '@/types';

interface AuditLog {
  id: string;
  school_id: string | null;
  actor_role: string | null;
  action: string;
  entity: string | null;
  created_at: string;
}

export function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const [logRes, schoolRes] = await Promise.all([
      supabase.from('audit_logs').select('id, school_id, actor_role, action, entity, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('schools').select('id, name'),
    ]);
    setLogs((logRes.data as AuditLog[]) ?? []);
    setSchools((schoolRes.data as School[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const schoolMap = useMemo(() => {
    const m: Record<string, string> = {};
    schools.forEach((s) => { m[s.id] = s.name; });
    return m;
  }, [schools]);

  const filteredLogs = useMemo(() => {
    let list = logs;
    if (roleFilter !== 'all') list = list.filter((l) => l.actor_role === roleFilter);
    if (schoolFilter !== 'all') {
      if (schoolFilter === 'platform') list = list.filter((l) => !l.school_id);
      else list = list.filter((l) => l.school_id === schoolFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.action.toLowerCase().includes(q) || (l.entity ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [logs, search, roleFilter, schoolFilter]);

  const roleBadgeVariant = (role: string | null) => {
    if (role === 'super_admin') return 'primary' as const;
    if (role === 'school_admin') return 'success' as const;
    if (role === 'teacher') return 'warning' as const;
    return 'secondary' as const;
  };

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Platform activity history"
        icon={<ScrollText className="h-6 w-6" />}
      />

      <Card>
        <CardHeader
          title="Activity Feed"
          subtitle={`${filteredLogs.length} event${filteredLogs.length !== 1 ? 's' : ''} (showing latest 200)`}
          action={
            <div className="flex items-center gap-2">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input text-sm py-1.5 px-2">
                <option value="all">All roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="school_admin">School Admin</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
              <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="input text-sm py-1.5 px-2">
                <option value="all">All schools</option>
                <option value="platform">Platform-level</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          }
        />
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input className="input text-sm pl-9" placeholder="Search by action or entity…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <RowSkeleton rows={8} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState title="No activity found" description="Audit logs will appear here as users interact with the platform." icon={<Activity className="h-10 w-10" />} />
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-surface-overlay">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  log.actor_role === 'super_admin' ? 'bg-primary-soft text-primary-light' :
                  log.actor_role === 'school_admin' ? 'bg-success-soft text-success-soft-text' :
                  log.actor_role === 'teacher' ? 'bg-warning-soft text-warning-soft-text' :
                  'bg-surface-overlay text-ink-muted'
                }`}>
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-ink dark:text-slate-100">{log.action}</p>
                    {log.actor_role && <Badge variant={roleBadgeVariant(log.actor_role)} className="capitalize text-xs">{log.actor_role.replace('_', ' ')}</Badge>}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {log.school_id ? schoolMap[log.school_id] ?? 'Unknown school' : 'Platform-level'}
                    {log.entity ? ` · ${log.entity}` : ''}
                  </p>
                </div>
                <span className="text-xs text-ink-muted shrink-0">{relativeTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
