import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, BookOpen, ClipboardList, ChevronDown, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useParent } from '@/context/ParentContext';
import { useAcademic } from '@/context/AcademicContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Form';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { RowSkeleton, CardSkeleton } from '@/components/ui/Spinner';
import { formatDate, cn } from '@/lib/utils';
import type { ExamSession, Exam, Subject, ClassRow } from '@/types';

export function ParentExams() {
  const { profile } = useAuth();
  const { children, selectedChild, selectedChildClass, loading, selectChild } = useParent();
  const { years, selectedYearId, setYear } = useAcademic();

  const [yearId, setYearId] = useState(selectedYearId);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [childMenuOpen, setChildMenuOpen] = useState(false);

  useEffect(() => { setYearId(selectedYearId); }, [selectedYearId]);

  useEffect(() => {
    if (!yearId || !profile?.school_id) { setSessions([]); return; }
    supabase
      .from('exam_sessions')
      .select('*')
      .eq('school_id', profile.school_id)
      .eq('academic_year_id', yearId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSessions((data as ExamSession[]) ?? []));
  }, [yearId, profile?.school_id]);

  useEffect(() => {
    if (!profile?.school_id) { setSubjects([]); setClasses([]); return; }
    Promise.all([
      supabase.from('subjects').select('*').eq('school_id', profile.school_id),
      supabase.from('classes').select('*').eq('school_id', profile.school_id),
    ]).then(([subRes, clsRes]) => {
      setSubjects((subRes.data as Subject[]) ?? []);
      setClasses((clsRes.data as ClassRow[]) ?? []);
    });
  }, [profile?.school_id]);

  const subjectMap = useMemo(() => {
    const m: Record<string, Subject> = {};
    subjects.forEach((s) => { m[s.id] = s; });
    return m;
  }, [subjects]);

  const classMap = useMemo(() => {
    const m: Record<string, ClassRow> = {};
    classes.forEach((c) => { m[c.id] = c; });
    return m;
  }, [classes]);

  useEffect(() => {
    if (sessions.length === 0 || !selectedChild) { setExams([]); return; }
    setDataLoading(true);
    const sessionIds = sessions.map((s) => s.id);
    let query = supabase
      .from('exams')
      .select('*')
      .in('exam_session_id', sessionIds)
      .order('exam_date', { ascending: true });
    if (selectedChild.class_id) {
      query = query.eq('class_id', selectedChild.class_id);
    }
    query.then(({ data }) => {
      setExams((data as Exam[]) ?? []);
      setDataLoading(false);
    });
  }, [sessions, selectedChild]);

  const examsBySession = useMemo(() => {
    const map: Record<string, Exam[]> = {};
    exams.forEach((ex) => {
      const key = ex.exam_session_id ?? 'unknown';
      if (!map[key]) map[key] = [];
      map[key].push(ex);
    });
    return map;
  }, [exams]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Exam Schedule" subtitle="View upcoming exams for your child" icon={<ClipboardList className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="mt-6"><RowSkeleton rows={4} /></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div>
        <PageHeader title="Exam Schedule" subtitle="View upcoming exams for your child" icon={<ClipboardList className="h-5 w-5" />} />
        <Card>
          <EmptyState title="No children linked" description="No student records are linked to your account. Please contact the school administrator." icon={<ClipboardList className="h-10 w-10" />} />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Exam Schedule"
        subtitle="View upcoming exams for your child"
        icon={<ClipboardList className="h-5 w-5" />}
        action={
          children.length > 1 ? (
            <div className="relative">
              <button
                onClick={() => setChildMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-ink dark:text-slate-100 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Avatar name={selectedChild?.full_name ?? ''} src={selectedChild?.photo_url} size="xs" />
                <span className="max-w-[120px] truncate">{selectedChild?.full_name}</span>
                <ChevronDown className="h-4 w-4 text-ink-muted" />
              </button>
              {childMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setChildMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-lg">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => { selectChild(child.id); setChildMenuOpen(false); }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors',
                          selectedChild?.id === child.id ? 'bg-primary-50 dark:bg-primary-500/15' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        )}
                      >
                        <Avatar name={child.full_name} src={child.photo_url} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink dark:text-slate-100">{child.full_name}</p>
                          <p className="text-xs text-ink-muted">{child.admission_number}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : undefined
        }
      />

      {selectedChild && (
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar name={selectedChild.full_name} src={selectedChild.photo_url} size="md" />
            <div>
              <p className="font-semibold text-ink dark:text-slate-100">{selectedChild.full_name}</p>
              <p className="text-sm text-ink-muted">
                {selectedChild.admission_number} · {selectedChildClass?.name ?? 'No class assigned'}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <Select label="Academic Year" value={yearId} onChange={(e) => { setYearId(e.target.value); setYear(e.target.value); }}>
          <option value="">Select year...</option>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </Select>
      </Card>

      {!yearId ? (
        <Card>
          <EmptyState title="Select academic year" description="Choose an academic year to view exam schedules for your child." icon={<Calendar className="h-10 w-10" />} />
        </Card>
      ) : dataLoading ? (
        <RowSkeleton rows={4} />
      ) : sessions.length === 0 ? (
        <Card>
          <EmptyState title="No exam sessions" description="There are no exam sessions for the selected academic year." icon={<ClipboardList className="h-10 w-10" />} />
        </Card>
      ) : (
        <div className="space-y-6">
          {sessions.map((session) => {
            const sessionExams = examsBySession[session.id] ?? [];
            const badge = statusBadge(session.status);
            return (
              <Card key={session.id}>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink dark:text-slate-100">{session.name}</h3>
                    <p className="text-sm text-ink-muted mt-0.5">
                      {formatDate(session.start_date)} — {formatDate(session.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {session.published && <Badge variant="success">Published</Badge>}
                  </div>
                </div>

                {sessionExams.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-ink-muted">
                    No exams scheduled for {selectedChildClass?.name ?? "your child's class"} yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessionExams.map((ex) => (
                      <div key={ex.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-light">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-ink dark:text-slate-100">{ex.name}</p>
                            <p className="text-xs text-ink-muted">
                              {subjectMap[ex.subject_id ?? '']?.name ?? '—'} · {classMap[ex.class_id ?? '']?.name ?? '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-ink-soft dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-ink-muted" />
                            {ex.exam_date ? formatDate(ex.exam_date) : 'TBD'}
                          </span>
                          {ex.start_time && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-ink-muted" />
                              {ex.start_time}{ex.end_time ? `–${ex.end_time}` : ''}
                            </span>
                          )}
                          {ex.room && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-ink-muted" />
                              {ex.room}
                            </span>
                          )}
                          <Badge variant="secondary">
                            <Award className="mr-1 h-3 w-3" />
                            {ex.total_marks} marks
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
