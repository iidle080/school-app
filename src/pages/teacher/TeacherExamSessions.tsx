import { useMemo, useState, useEffect } from 'react';
import { ClipboardCheck, Calendar, Info, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useAcademic } from '@/context/AcademicContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Form';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { RowSkeleton } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Exam } from '@/types';

export function TeacherExamSessions() {
  const { profile } = useAuth();
  const { examSessions, loading } = useSchoolData();
  const { years, selectedYearId, setYear } = useAcademic();

  const [selectedYear, setSelectedYear] = useState(selectedYearId);
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});

  // Sync with academic context
  useEffect(() => {
    setSelectedYear(selectedYearId);
  }, [selectedYearId]);

  // Filter sessions by academic year
  const filteredSessions = useMemo(() => {
    if (!selectedYear) return examSessions;
    return examSessions.filter((es) => es.academic_year_id === selectedYear);
  }, [examSessions, selectedYear]);

  // Load exam counts per session
  useEffect(() => {
    if (!profile?.school_id || filteredSessions.length === 0) {
      setExamCounts({});
      return;
    }
    (async () => {
      const counts: Record<string, number> = {};
      for (const es of filteredSessions) {
        const { count } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('exam_session_id', es.id);
        counts[es.id] = count ?? 0;
      }
      setExamCounts(counts);
    })();
  }, [filteredSessions, profile?.school_id]);

  return (
    <div>
      <PageHeader
        title="Exam Sessions"
        subtitle="View exam sessions created by your school administrator"
        icon={<ClipboardCheck className="h-5 w-5" />}
      />

      {/* Info Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4 dark:border-primary-500/20 dark:bg-primary-500/10">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-light" />
        <div>
          <p className="text-sm font-medium text-primary-700 dark:text-primary-light">
            Exam Sessions are created by your School Administrator.
          </p>
          <p className="text-sm text-primary-600/80 dark:text-primary-light/70 mt-0.5">
            You can view exam sessions here. To enter marks, use the Marks Entry page.
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <Select label="Academic Year" value={selectedYear} onChange={(e) => {
          setSelectedYear(e.target.value);
          setYear(e.target.value);
        }}>
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
        </Select>
      </Card>

      {/* Sessions */}
      {loading ? (
        <RowSkeleton rows={4} />
      ) : filteredSessions.length === 0 ? (
        <Card>
          <EmptyState
            title="No exam sessions"
            description="There are no exam sessions for the selected academic year."
            icon={<ClipboardCheck className="h-10 w-10" />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((es) => {
            const badge = statusBadge(es.status);
            const examCount = examCounts[es.id] ?? 0;
            return (
              <Card key={es.id} hover>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-light">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink dark:text-slate-100">{es.name}</p>
                      <p className="text-xs text-ink-muted">
                        {years.find((y) => y.id === es.academic_year_id)?.name ?? '—'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(es.start_date)} — {formatDate(es.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink-muted">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>{examCount} exam{examCount !== 1 ? 's' : ''}</span>
                  </div>
                  {es.published && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Lock className="h-4 w-4" />
                      <span>Results published</span>
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span>Session Status</span>
                    <span className="capitalize">{es.status}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        es.status === 'published'
                          ? 'bg-emerald-500 w-full'
                          : es.status === 'completed'
                          ? 'bg-primary-500 w-3/4'
                          : es.status === 'scheduled'
                          ? 'bg-amber-500 w-1/2'
                          : 'bg-slate-300 w-1/4 dark:bg-slate-700'
                      }`}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
