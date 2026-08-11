import { useMemo, useState } from 'react';
import { BookOpenCheck, QrCode, KeyRound, TrendingUp, Calendar } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PageHeader, ProgressBar, Badge, StatCard, EmptyState } from '@/components/ui';
import { attendancePercentage, fmtTime } from '@/lib/schedule';

export default function StudentAttendance() {
  const { currentUser, state, recordsForStudent, classById } = useStore();
  const student = currentUser!;
  const [filter, setFilter] = useState<string>('all'); // classId or 'all'

  const records = useMemo(() => recordsForStudent(student.id), [recordsForStudent, student.id]);
  const myClasses = state.classes.filter((c) => student.classIds?.includes(c.id));

  // per class stats
  const perClass = myClasses.map((c) => {
    const myRecs = records.filter((r) => r.classId === c.id);
    const present = new Set(myRecs.map((r) => r.sessionId)).size;
    const classRecs = state.records.filter((r) => r.classId === c.id);
    const histSessions = new Set(classRecs.map((r) => r.sessionId));
    const live = state.sessions.filter((s) => s.classId === c.id).length;
    const total = histSessions.size + live;
    return { class: c, present, total, pct: attendancePercentage(present, total) };
  });

  const totalPresent = new Set(records.map((r) => r.sessionId)).size;
  const totalExpected = perClass.reduce((a, c) => a + c.total, 0);
  const overall = attendancePercentage(totalPresent, totalExpected);

  const filteredRecords = filter === 'all' ? records : records.filter((r) => r.classId === filter);
  const sorted = [...filteredRecords].sort((a, b) => b.markedAt - a.markedAt);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My attendance"
        subtitle="Track your attendance percentage across all enrolled classes."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Overall attendance" value={`${overall}%`} icon={<TrendingUp size={18} />} tone={overall >= 75 ? 'green' : overall >= 50 ? 'amber' : 'rose'} sub={`${totalPresent}/${totalExpected} sessions`} />
        <StatCard label="Classes tracked" value={myClasses.length} icon={<BookOpenCheck size={18} />} tone="brand" />
        <StatCard label="Records" value={records.length} icon={<Calendar size={18} />} tone="violet" />
      </div>

      {/* Per class bars */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold text-ink-900">Attendance by class</h2>
        <div className="mt-4 space-y-4">
          {perClass.map(({ class: c, present, total, pct }) => (
            <div key={c.id} className={`rounded-xl border p-4 cursor-pointer transition ${filter === c.id ? 'border-brand-300 bg-brand-50/40' : 'border-ink-100 hover:bg-ink-50'}`} onClick={() => setFilter(filter === c.id ? 'all' : c.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                  <span className="font-semibold text-ink-900">{c.name}</span>
                  <Badge tone="gray">{c.code}</Badge>
                </div>
                <span className={`font-display font-bold ${pct >= 75 ? 'text-accent-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{pct}%</span>
              </div>
              <div className="mt-2"><ProgressBar value={pct} tone={pct >= 75 ? 'green' : pct >= 50 ? 'amber' : 'rose'} /></div>
              <div className="mt-1 text-xs text-ink-400">{present} present · {total} total sessions</div>
            </div>
          ))}
          {myClasses.length === 0 && <div className="text-sm text-ink-400">No enrolled classes.</div>}
        </div>
      </div>

      {/* Records */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">Attendance records</h2>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Clear filter
            </button>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {sorted.length === 0 && (
            <EmptyState icon={<Calendar size={20} />} title="No records yet" hint="Mark attendance via the scan page to see records here." />
          )}
          {sorted.map((r) => {
            const cls = classById(r.classId);
            const d = new Date(r.markedAt);
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                <div className="h-9 w-1.5 rounded-full" style={{ background: cls?.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-900">{cls?.name ?? 'Class'}</div>
                  <div className="text-xs text-ink-400">
                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <Badge tone={r.method === 'qr' ? 'brand' : 'violet'}>
                  {r.method === 'qr' ? <QrCode size={11} /> : <KeyRound size={11} />} {r.method === 'qr' ? 'QR' : 'Manual'}
                </Badge>
                <Badge tone="green">Present</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
