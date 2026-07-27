import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CalendarCheck, BookCopy, ClipboardList, FileText, MessageSquare, Megaphone, CalendarDays, BellRing, User, Send, Download, Printer, ChevronRight, Check, X, Search, Smile, Paperclip, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useParent } from '@/context/ParentContext';
import { useSchool } from '@/hooks/useSchool';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Form';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { RowSkeleton, CardSkeleton } from '@/components/ui/Spinner';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatDate, relativeTime, percentage, gradeFromPercentage, cn } from '@/lib/utils';
import { ATTENDANCE_LABELS } from '@/lib/constants';
import type { Student, Attendance, Homework, ExamMark, ReportCard, Message, Notification, AppUser, ClassRow } from '@/types';

function className(classes: ClassRow[], id: string | null): string {
  if (!id) return '—';
  const c = classes.find((x) => x.id === id);
  return c ? `${c.name}${c.stream ? ` · ${c.stream}` : ''}` : '—';
}

export function ParentDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { children, classes, loading, selectChild } = useParent();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ attendance: 0, homework: 0, results: 0 });

  useEffect(() => {
    if (children.length === 0) return;
    const ids = children.map((c) => c.id);
    const classIds = children.map((c) => c.class_id).filter(Boolean) as string[];
    (async () => {
      const [att, hw, mk] = await Promise.all([
        supabase.from('attendance').select('id', { count: 'exact', head: true }).in('student_id', ids),
        supabase.from('homework').select('id', { count: 'exact', head: true }).in('class_id', classIds),
        supabase.from('exam_marks').select('id', { count: 'exact', head: true }).in('student_id', ids),
      ]);
      setStats({ attendance: att.count ?? 0, homework: hw.count ?? 0, results: mk.count ?? 0 });
    })();
  }, [children]);

  const openChild = (id: string) => {
    selectChild(id);
    navigate('/parent/children');
  };

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name.split(' ')[0] ?? ''}`} subtitle={school?.name ?? 'Parent portal'} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="My Children" value={children.length} icon={<GraduationCap className="h-5 w-5" />} />
            <StatCard label="Attendance Records" value={stats.attendance} icon={<CalendarCheck className="h-5 w-5" />} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
            <StatCard label="Homework" value={stats.homework} icon={<BookCopy className="h-5 w-5" />} accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
            <StatCard label="Exam Results" value={stats.results} icon={<ClipboardList className="h-5 w-5" />} accent="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" />
          </div>
          <Card>
            <CardHeader title="My Children" />
            {children.length === 0 ? <EmptyState title="No children linked" description="Your school admin will link your children's profiles." /> : (
              <div className="space-y-2">{children.map((c) => (
                <button key={c.id} onClick={() => openChild(c.id)} className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-colors">
                  <Avatar name={c.full_name} src={c.photo_url} size="md" />
                  <div className="flex-1">
                    <p className="font-medium text-ink dark:text-slate-100">{c.full_name}</p>
                    <p className="text-xs text-ink-muted">#{c.admission_number} · {className(classes, c.class_id)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-muted" />
                </button>
              ))}</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export function ParentChildren() {
  const { children, classes, loading, selectChild } = useParent();
  const navigate = useNavigate();

  const openChild = (id: string) => {
    selectChild(id);
    navigate('/parent/attendance');
  };

  return (
    <div>
      <PageHeader title="My Children" subtitle="Select a child to view their information." icon={<GraduationCap className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : children.length === 0 ? <Card><EmptyState title="No children linked" description="Your school admin will link your children's profiles." /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children.map((c) => (
          <Card key={c.id} hover>
            <button onClick={() => openChild(c.id)} className="w-full text-left">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={c.full_name} src={c.photo_url} size="lg" />
                <div>
                  <h3 className="font-semibold text-ink dark:text-slate-100">{c.full_name}</h3>
                  <p className="text-xs text-ink-muted">#{c.admission_number}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-ink-soft dark:text-slate-300">
                <p>Class: {className(classes, c.class_id)}</p>
                <p>Gender: <span className="capitalize">{c.gender ?? '—'}</span></p>
                <p>DOB: {c.date_of_birth ? formatDate(c.date_of_birth) : '—'}</p>
                {c.medical_notes && <p className="text-warning-dark">Medical: {c.medical_notes}</p>}
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600">
                View details <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </Card>
        ))}</div>
      )}
    </div>
  );
}

function SelectedChildBanner() {
  const { selectedChild, children, selectChild } = useParent();
  if (!selectedChild) return null;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl bg-primary-50 dark:bg-primary-500/10 p-3">
      <Avatar name={selectedChild.full_name} src={selectedChild.photo_url} size="sm" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink dark:text-slate-100">{selectedChild.full_name}</p>
        <p className="text-xs text-ink-muted">#{selectedChild.admission_number}</p>
      </div>
      {children.length > 1 && (
        <Select value={selectedChild.id} onChange={(e) => selectChild(e.target.value)} className="w-auto text-sm">
          {children.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </Select>
      )}
    </div>
  );
}

export function ParentAttendance() {
  const { selectedChild, loading } = useParent();
  const [records, setRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    if (!selectedChild) { setRecords([]); return; }
    supabase.from('attendance').select('*').eq('student_id', selectedChild.id).order('date', { ascending: false }).limit(60).then(({ data }) => setRecords((data as Attendance[]) ?? []));
  }, [selectedChild]);

  // Group by date, showing morning + afternoon side by side
  const byDate = new Map<string, { morning?: Attendance; afternoon?: Attendance }>();
  records.forEach((r) => {
    const entry = byDate.get(r.date) ?? {};
    if (r.session === 'morning') entry.morning = r; else entry.afternoon = r;
    byDate.set(r.date, entry);
  });
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const late = records.filter((r) => r.status === 'late').length;
  const morningRecords = records.filter((r) => r.session === 'morning');
  const afternoonRecords = records.filter((r) => r.session === 'afternoon');
  const morningPct = morningRecords.length ? Math.round((morningRecords.filter((r) => r.status === 'present').length / morningRecords.length) * 100) : 0;
  const afternoonPct = afternoonRecords.length ? Math.round((afternoonRecords.filter((r) => r.status === 'present').length / afternoonRecords.length) * 100) : 0;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Your child's morning and afternoon attendance." icon={<CalendarCheck className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" description="Select a child from the switcher above." /></Card> : (
        <>
          <SelectedChildBanner />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <StatCard label="Morning %" value={`${morningPct}%`} icon={<CalendarCheck className="h-5 w-5" />} />
            <StatCard label="Afternoon %" value={`${afternoonPct}%`} icon={<CalendarCheck className="h-5 w-5" />} accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
            <StatCard label="Total Present" value={present} icon={<Check className="h-5 w-5" />} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
            <StatCard label="Total Absent" value={absent} icon={<X className="h-5 w-5" />} accent="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" />
          </div>
          {dates.length === 0 ? <Card><EmptyState title="No attendance records" /></Card> : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-ink-muted border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Morning</th><th className="py-2 pr-4">Afternoon</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dates.map((d) => { const e = byDate.get(d)!; const mb = e.morning ? statusBadge(e.morning.status) : null; const ab = e.afternoon ? statusBadge(e.afternoon.status) : null; return (
                      <tr key={d}>
                        <td className="py-2 pr-4 text-ink dark:text-slate-100">{formatDate(d)}</td>
                        <td className="py-2 pr-4">{mb ? <Badge variant={mb.variant}>{mb.label}</Badge> : <span className="text-ink-muted">—</span>}</td>
                        <td className="py-2 pr-4">{ab ? <Badge variant={ab.variant}>{ab.label}</Badge> : <span className="text-ink-muted">—</span>}</td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export function ParentHomework() {
  const { selectedChild, loading } = useParent();
  const [items, setItems] = useState<Homework[]>([]);

  useEffect(() => {
    if (!selectedChild?.class_id) { setItems([]); return; }
    supabase.from('homework').select('*').eq('class_id', selectedChild.class_id).order('created_at', { ascending: false }).then(({ data }) => setItems((data as Homework[]) ?? []));
  }, [selectedChild]);

  return (
    <div>
      <PageHeader title="Homework" subtitle="Homework assigned to your child's class." icon={<BookCopy className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          {items.length === 0 ? <Card><EmptyState title="No homework" /></Card> : (
            <div className="space-y-3">{items.map((h) => (
              <Card key={h.id}>
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink dark:text-slate-100">{h.title}</p>{h.description && <p className="text-sm text-ink-soft dark:text-slate-300 mt-1">{h.description}</p>}<p className="text-xs text-ink-muted mt-2">Due {formatDate(h.due_date)}</p></div>
                  {h.attachments?.length > 0 && <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />}>Attachments</Button>}
                </div>
              </Card>
            ))}</div>
          )}
        </>
      )}
    </div>
  );
}

export function ParentResults() {
  const { selectedChild, loading } = useParent();
  const [marks, setMarks] = useState<ExamMark[]>([]);

  useEffect(() => {
    if (!selectedChild) { setMarks([]); return; }
    supabase.from('exam_marks').select('*').eq('student_id', selectedChild.id).order('created_at', { ascending: false }).then(({ data }) => setMarks((data as ExamMark[]) ?? []));
  }, [selectedChild]);

  const columns: Column<ExamMark>[] = [
    { key: 'subject', header: 'Subject ID', render: (m) => <span className="text-xs">{m.subject_id.slice(0, 8)}</span> },
    { key: 'marks', header: 'Marks', render: (m) => `${m.marks ?? '—'} / ${m.total_marks}` },
    { key: 'pct', header: '%', render: (m) => { const p = percentage(m.marks, m.total_marks); return p !== null ? `${p}%` : '—'; } },
    { key: 'grade', header: 'Grade', render: (m) => m.grade ? <Badge variant="primary">{m.grade}</Badge> : '—' },
    { key: 'comment', header: 'Teacher Comment', render: (m) => m.teacher_comment ?? '—' },
  ];

  return (
    <div>
      <PageHeader title="Exam Results" subtitle="Your child's exam results." icon={<ClipboardList className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          <Card><DataTable columns={columns} data={marks} rowKey={(m) => m.id} emptyTitle="No results yet" /></Card>
        </>
      )}
    </div>
  );
}

export function ParentReports() {
  const { selectedChild, children, selectChild, loading } = useParent();
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [viewing, setViewing] = useState<ReportCard | null>(null);

  useEffect(() => {
    if (!selectedChild) { setReports([]); return; }
    supabase.from('report_cards').select('*').eq('student_id', selectedChild.id).eq('published', true).order('created_at', { ascending: false }).then(({ data }) => setReports((data as ReportCard[]) ?? []));
  }, [selectedChild]);

  return (
    <div>
      <PageHeader title="Report Cards" subtitle="Digital report cards for your child." icon={<FileText className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          {reports.length === 0 ? <Card><EmptyState title="No report cards" /></Card> : (
            <div className="space-y-3">{reports.map((r) => (
              <Card key={r.id}><div className="flex items-center justify-between gap-3">
                <div><p className="font-semibold text-ink dark:text-slate-100">{r.title}</p><p className="text-sm text-ink-muted">{r.overall_grade ?? '—'}</p></div>
                <Button size="sm" variant="secondary" onClick={() => setViewing(r)}>View</Button>
              </div></Card>
            ))}</div>
          )}
        </>
      )}
      {viewing && selectedChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-ink dark:text-slate-100">{viewing.title}</h2><Button size="sm" variant="secondary" leftIcon={<Printer className="h-3.5 w-3.5" />} onClick={() => window.print()}>Print</Button></div>
            <div className="space-y-3 text-sm">
              <p className="text-ink-soft dark:text-slate-300">Student: {selectedChild.full_name}</p>
              <p className="text-ink-soft dark:text-slate-300">Overall Grade: <span className="font-bold">{viewing.overall_grade ?? '—'}</span></p>
              <p className="text-ink-soft dark:text-slate-300">Overall Marks: {viewing.overall_marks ?? '—'}</p>
              {viewing.summary && <p className="text-ink-soft dark:text-slate-300">{viewing.summary}</p>}
              {viewing.teacher_remarks && <div><p className="font-semibold text-ink dark:text-slate-100">Teacher Remarks</p><p className="text-ink-soft dark:text-slate-300">{viewing.teacher_remarks}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ParentMessages() {
  const { profile } = useAuth();
  const { selectedChild, children, classes, selectChild } = useParent();
  const { toast } = useToast();
  const { school } = useSchool();
  const [tab, setTab] = useState<'teachers' | 'admin'>('teachers');
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [admins, setAdmins] = useState<AppUser[]>([]);
  const [activeChat, setActiveChat] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [lastMsgMap, setLastMsgMap] = useState<Record<string, Message>>({});
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load teachers who teach the parent's children + school admins
  useEffect(() => {
    if (!profile?.school_id) return;
    const childClassIds = children.map((c) => c.class_id).filter(Boolean) as string[];
    if (childClassIds.length) {
      supabase.from('class_subjects').select('teacher_id').in('class_id', childClassIds).then(({ data }) => {
        const teacherIds = Array.from(new Set((data ?? []).map((r: { teacher_id: string }) => r.teacher_id).filter(Boolean)));
        if (teacherIds.length) supabase.from('app_users').select('*').in('id', teacherIds).eq('school_id', profile.school_id).then(({ data }) => setTeachers((data as AppUser[]) ?? []));
      });
    }
    supabase.from('app_users').select('*').eq('school_id', profile.school_id).eq('role', 'school_admin').then(({ data }) => setAdmins((data as AppUser[]) ?? []));
  }, [profile?.school_id, children]);

  const contactList = tab === 'teachers' ? teachers : admins;
  const filteredContacts = search.trim() ? contactList.filter((c) => c.full_name.toLowerCase().includes(search.toLowerCase())) : contactList;

  const conversationId = (a: string, b: string) => [a, b].sort().join('|');

  useEffect(() => {
    if (!activeChat || !profile?.user_id) return;
    const cid = conversationId(profile.user_id, activeChat);
    supabase.from('messages').select('*').eq('conversation_id', cid).order('created_at', { ascending: true }).then(({ data }) => {
      setMessages((data as Message[]) ?? []);
      const unread = (data ?? []).filter((m: Message) => m.recipient_id === profile.user_id && !m.read_at);
      if (unread.length) {
        supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unread.map((m: Message) => m.id)).then(() => {
          setMessages((prev) => prev.map((m) => m.recipient_id === profile.user_id ? { ...m, read_at: m.read_at ?? new Date().toISOString() } : m));
        });
      }
    });
  }, [activeChat, profile?.user_id]);

  useEffect(() => {
    if (!profile?.user_id || contactList.length === 0) return;
    (async () => {
      const uMap: Record<string, number> = {};
      const lMap: Record<string, Message> = {};
      for (const c of contactList) {
        const cid = conversationId(profile.user_id, c.user_id);
        const { data } = await supabase.from('messages').select('*').eq('conversation_id', cid).order('created_at', { ascending: false });
        const msgs = (data as Message[]) ?? [];
        uMap[c.user_id] = msgs.filter((m) => m.recipient_id === profile.user_id && !m.read_at).length;
        if (msgs[0]) lMap[c.user_id] = msgs[0];
      }
      setUnreadMap(uMap); setLastMsgMap(lMap);
    })();
  }, [profile?.user_id, contactList.length, tab]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChat || !profile?.user_id) return;
    const cid = conversationId(profile.user_id, activeChat);
    const childContext = selectedChild ? ` [Re: ${selectedChild.full_name}]` : '';
    const { data, error } = await supabase.from('messages').insert({
      school_id: profile.school_id, sender_id: profile.user_id, recipient_id: activeChat,
      body: input + childContext, conversation_id: cid, message_type: 'text',
    }).select().single();
    if (error) { toast(error.message, 'error'); return; }
    setMessages((prev) => [...prev, data as Message]);
    setInput(''); setShowEmoji(false);
  };

  const activeContact = contactList.find((c) => c.user_id === activeChat);

  return (
    <div>
      <PageHeader title="Messages" subtitle="Chat with your children's teachers." icon={<MessageSquare className="h-5 w-5" />} />
      {children.length > 1 && <SelectedChildBanner />}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr] h-[calc(100vh-220px)]">
        <Card className="flex flex-col overflow-hidden">
          <div className="flex gap-2 p-3 border-b border-slate-100 dark:border-slate-800">
            <button onClick={() => { setTab('teachers'); setActiveChat(''); }} className={cn('flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', tab === 'teachers' ? 'bg-primary text-white' : 'bg-slate-100 text-ink-soft dark:bg-slate-800 dark:text-slate-300')}>Teachers</button>
            <button onClick={() => { setTab('admin'); setActiveChat(''); }} className={cn('flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', tab === 'admin' ? 'bg-primary text-white' : 'bg-slate-100 text-ink-soft dark:bg-slate-800 dark:text-slate-300')}>Admin</button>
          </div>
          <div className="p-3 border-b border-slate-100 dark:border-slate-800"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" leftIcon={<Search className="h-4 w-4" />} /></div>
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? <div className="p-4"><EmptyState title="No contacts" /></div> : filteredContacts.map((c) => {
              const last = lastMsgMap[c.user_id];
              const unread = unreadMap[c.user_id] ?? 0;
              return (
                <button key={c.user_id} onClick={() => setActiveChat(c.user_id)} className={cn('flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50', activeChat === c.user_id && 'bg-primary-50 dark:bg-primary-500/10')}>
                  <Avatar name={c.full_name} src={c.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-slate-100 truncate">{c.full_name}</p>
                    {last && <p className="text-xs text-ink-muted truncate">{last.sender_id === profile?.user_id ? 'You: ' : ''}{last.body}</p>}
                  </div>
                  {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-white text-xs px-1.5">{unread}</span>}
                </button>
              );
            })}
          </div>
        </Card>
        <Card className="flex flex-col overflow-hidden">
          {!activeChat ? <div className="flex-1 flex items-center justify-center"><EmptyState title="Select a conversation" icon={<MessageSquare className="h-8 w-8" />} /></div> : (
            <>
              <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800">
                <Avatar name={activeContact?.full_name ?? ''} src={activeContact?.avatar_url} size="sm" />
                <p className="font-medium text-ink dark:text-slate-100">{activeContact?.full_name}</p>
                {selectedChild && <Badge variant="primary">Re: {selectedChild.full_name}</Badge>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m) => {
                  const mine = m.sender_id === profile?.user_id;
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[70%] rounded-2xl px-3 py-2', mine ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-ink dark:text-slate-100')}>
                        <p className="text-sm">{m.body}</p>
                        <div className={cn('flex items-center gap-1 mt-0.5 text-xs', mine ? 'text-primary-100' : 'text-ink-muted')}>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {mine && (m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowEmoji((v) => !v)} className="p-2 text-ink-muted hover:text-primary-600"><Smile className="h-5 w-5" /></button>
                <button type="button" className="p-2 text-ink-muted hover:text-primary-600"><Paperclip className="h-5 w-5" /></button>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-ink dark:text-slate-100 focus:ring-2 focus:ring-primary-500/30 outline-none" />
                <Button type="submit" size="sm" leftIcon={<Send className="h-4 w-4" />}>Send</Button>
              </form>
              {showEmoji && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex gap-1 flex-wrap">
                  {['😀','😂','😍','👍','👏','🙏','❤️','🎉','🔥','✅','❌','⭐'].map((e) => (
                    <button key={e} type="button" onClick={() => { setInput((v) => v + e); setShowEmoji(false); }} className="text-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">{e}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export function ParentAnnouncements() {
  const { profile } = useAuth();
  const { selectedChild, classes, loading } = useParent();
  const [items, setItems] = useState<any[]>([]);
  const [loadDone, setLoadDone] = useState(true);

  useEffect(() => {
    if (!profile?.school_id) return;
    setLoadDone(false);
    const childClassIds = selectedChild?.class_id ? [selectedChild.class_id] : classes.map((c) => c.id);
    supabase.from('announcements').select('*').eq('school_id', profile.school_id).in('audience', ['school', 'emergency', 'class']).order('created_at', { ascending: false }).then(({ data }) => {
      const filtered = (data ?? []).filter((a: any) => {
        if (a.audience === 'school' || a.audience === 'emergency') return true;
        if (a.audience === 'class' && a.class_id) return childClassIds.includes(a.class_id);
        return false;
      });
      setItems(filtered); setLoadDone(true);
    });
  }, [profile?.school_id, selectedChild, classes]);

  return (
    <div>
      <PageHeader title="Announcements" subtitle="School-wide and class announcements." icon={<Megaphone className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          {!loadDone ? <RowSkeleton /> : items.length === 0 ? <Card><EmptyState title="No announcements" /></Card> : (
            <div className="space-y-3">{items.map((a) => <Card key={a.id}><p className="font-semibold text-ink dark:text-slate-100">{a.title}</p><p className="text-sm text-ink-soft dark:text-slate-300 mt-1">{a.body}</p><p className="text-xs text-ink-muted mt-2">{relativeTime(a.created_at)}</p></Card>)}</div>
          )}
        </>
      )}
    </div>
  );
}

export function ParentCalendar() {
  const { profile } = useAuth();
  const { selectedChild, classes, loading } = useParent();
  const [events, setEvents] = useState<any[]>([]);
  const [loadDone, setLoadDone] = useState(true);

  useEffect(() => {
    if (!profile?.school_id) return;
    setLoadDone(false);
    const childClassIds = selectedChild?.class_id ? [selectedChild.class_id] : classes.map((c) => c.id);
    supabase.from('calendar_events').select('*').eq('school_id', profile.school_id).order('start_at', { ascending: true }).then(({ data }) => {
      const filtered = (data ?? []).filter((e: any) => {
        if (!e.class_id) return true;
        return childClassIds.includes(e.class_id);
      });
      setEvents(filtered); setLoadDone(true);
    });
  }, [profile?.school_id, selectedChild, classes]);

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Upcoming events for your child." icon={<CalendarDays className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : !selectedChild ? <Card><EmptyState title="No child selected" /></Card> : (
        <>
          <SelectedChildBanner />
          {!loadDone ? <RowSkeleton /> : events.length === 0 ? <Card><EmptyState title="No events" /></Card> : (
            <Card><div className="divide-y divide-slate-100 dark:divide-slate-800">{events.map((e) => <div key={e.id} className="py-3"><p className="font-medium text-ink dark:text-slate-100">{e.title}</p><p className="text-xs text-ink-muted">{formatDate(e.start_at)}</p></div>)}</div></Card>
          )}
        </>
      )}
    </div>
  );
}

export function ParentNotifications() {
  const { profile } = useAuth();
  const { selectedChild, children, loading } = useParent();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!profile?.user_id) return;
    supabase.from('notifications').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).then(({ data }) => setItems((data as Notification[]) ?? []));
  }, [profile?.user_id]);

  const childName = (id: string | null) => children.find((c) => c.id === id)?.full_name;

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Your recent notifications." icon={<BellRing className="h-5 w-5" />} />
      {loading ? <RowSkeleton /> : (
        <>
          {children.length > 1 && <SelectedChildBanner />}
          {items.length === 0 ? <Card><EmptyState title="No notifications" /></Card> : (
            <Card><div className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((n) => (
              <div key={n.id} className="py-3">
                <p className="text-sm font-medium text-ink dark:text-slate-100">{n.title}</p>
                {n.body && <p className="text-xs text-ink-muted">{n.body}</p>}
                {childName((n as any).student_id) && <p className="text-xs text-primary-600 mt-0.5">Re: {childName((n as any).student_id)}</p>}
                <p className="text-xs text-ink-muted mt-0.5">{relativeTime(n.created_at)}</p>
              </div>
            ))}</div></Card>
          )}
        </>
      )}
    </div>
  );
}

export function ParentProfile() {
  const { profile } = useAuth();
  const { school } = useSchool();
  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your parent profile." icon={<User className="h-5 w-5" />} />
      <div className="max-w-2xl"><Card>
        <div className="flex items-center gap-4 mb-4"><Avatar name={profile?.full_name ?? ''} src={profile?.avatar_url} size="lg" /><div><h2 className="text-lg font-bold text-ink dark:text-slate-100">{profile?.full_name}</h2><p className="text-sm text-ink-muted">{school?.name}</p></div></div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><p className="text-ink-muted">Role</p><p className="font-medium text-ink dark:text-slate-100">Parent</p></div>
          <div><p className="text-ink-muted">Phone</p><p className="font-medium text-ink dark:text-slate-100">{profile?.phone ?? '—'}</p></div>
        </div>
      </Card></div>
    </div>
  );
}
