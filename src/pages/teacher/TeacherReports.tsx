import { useMemo, useState } from 'react';
import { FileBarChart, Download, Users, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PageHeader, Badge, ProgressBar, EmptyState } from '@/components/ui';
import { attendancePercentage, WEEKDAYS } from '@/lib/schedule';

export default function TeacherReports() {
  const { currentUser, state } = useStore();
  const teacher = currentUser!;
  const myClasses = state.classes.filter((c) => c.teacherId === teacher.id);
  const [classId, setClassId] = useState<string>('all');

  const sessions = useMemo(() => {
    const list = state.sessions.filter((s) => myClasses.some((c) => c.id === s.classId));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [state.sessions, myClasses]);

  const filteredSessions = classId === 'all' ? sessions : sessions.filter((s) => s.classId === classId);

  const exportSession = (sessionId: string) => {
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const cls = myClasses.find((c) => c.id === session.classId);
    if (!cls) return;
    const recs = state.records.filter((r) => r.sessionId === sessionId);
    const presentIds = new Set(recs.map((r) => r.studentId));
    const rows = [['Roll No', 'Name', 'Status', 'Method', 'Time']];
    state.users.filter((u) => cls.studentIds.includes(u.id)).forEach((s) => {
      const rec = recs.find((r) => r.studentId === s.id);
      rows.push([s.rollNo ?? '', s.name, rec ? 'Present' : 'Absent', rec?.method ?? '', rec ? new Date(rec.markedAt).toLocaleTimeString() : '']);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${cls.code}_${new Date(session.createdAt).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance reports"
        subtitle="Browse past attendance sessions and export per-session records."
      />

      {myClasses.length === 0 ? (
        <EmptyState icon={<FileBarChart size={22} />} title="No reports yet" hint="Create classes and run attendance sessions to generate reports." />
      ) : (
        <>
          {/* Filter */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-ink-700">Filter by class:</span>
              <button onClick={() => setClassId('all')} className={`btn px-3 py-1.5 text-xs ${classId === 'all' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}>All</button>
              {myClasses.map((c) => (
                <button key={c.id} onClick={() => setClassId(c.id)} className={`btn px-3 py-1.5 text-xs ${classId === c.id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}>
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Per-class summary */}
          {classId === 'all' && (
            <div className="card p-5">
              <h2 className="font-display text-lg font-bold text-ink-900">Class summary</h2>
              <div className="mt-4 space-y-4">
                {myClasses.map((c) => {
                  const recs = state.records.filter((r) => r.classId === c.id);
                  const presentStudents = new Set(recs.map((r) => r.studentId)).size;
                  const avg = attendancePercentage(presentStudents, c.studentIds.length);
                  const classSessions = sessions.filter((s) => s.classId === c.id).length;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-semibold text-ink-800">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /> {c.name}
                        </span>
                        <span className="text-ink-500">{classSessions} sessions · {recs.length} records</span>
                      </div>
                      <div className="mt-1.5"><ProgressBar value={avg} tone={avg >= 75 ? 'green' : avg >= 50 ? 'amber' : 'rose'} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Session list */}
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-ink-900">Attendance sessions</h2>
            <div className="mt-4 space-y-2.5">
              {filteredSessions.length === 0 && (
                <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
                  No sessions yet for this class. Start one from the Take Attendance page.
                </div>
              )}
              {filteredSessions.map((s) => {
                const cls = myClasses.find((c) => c.id === s.classId);
                const recs = state.records.filter((r) => r.sessionId === s.id);
                const enrolled = cls?.studentIds.length ?? 0;
                const pct = attendancePercentage(recs.length, enrolled);
                const d = new Date(s.createdAt);
                return (
                  <div key={s.id} className="rounded-xl border border-ink-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-900">{cls?.name}</span>
                          <Badge tone={s.status === 'active' ? 'green' : 'gray'}>{s.status === 'active' ? 'Live' : 'Ended'}</Badge>
                        </div>
                        <div className="mt-0.5 text-xs text-ink-400">
                          {WEEKDAYS[d.getDay()]}, {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · Code {s.code}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-accent-600"><CheckCircle2 size={14} /> {recs.length}</span>
                          <span className="flex items-center gap-1 text-rose-500"><XCircle size={14} /> {enrolled - recs.length}</span>
                          <span className="font-semibold text-ink-700">{pct}%</span>
                        </div>
                        <button onClick={() => exportSession(s.id)} className="btn-secondary px-3 py-1.5 text-xs">
                          <Download size={13} /> CSV
                        </button>
                      </div>
                    </div>
                    <div className="mt-2"><ProgressBar value={pct} tone={pct >= 75 ? 'green' : pct >= 50 ? 'amber' : 'rose'} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
