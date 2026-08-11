import { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Award, AlertTriangle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PageHeader, StatCard, ProgressBar, Badge, EmptyState } from '@/components/ui';
import { attendancePercentage, WEEKDAYS } from '@/lib/schedule';

export default function TeacherAnalytics() {
  const { currentUser, state } = useStore();
  const teacher = currentUser!;
  const myClasses = state.classes.filter((c) => c.teacherId === teacher.id);

  // Per-class average attendance
  const classStats = useMemo(() => {
    return myClasses.map((c) => {
      const recs = state.records.filter((r) => r.classId === c.id);
      const presentStudents = new Set(recs.map((r) => r.studentId)).size;
      const avg = attendancePercentage(presentStudents, c.studentIds.length);
      return { class: c, avg, records: recs.length };
    });
  }, [myClasses, state.records]);

  // Per-student attendance across all my classes
  const studentStats = useMemo(() => {
    const allStudentIds = new Set(myClasses.flatMap((c) => c.studentIds));
    return Array.from(allStudentIds).map((sid) => {
      const student = state.users.find((u) => u.id === sid);
      let present = 0, total = 0;
      myClasses.forEach((c) => {
        if (!c.studentIds.includes(sid)) return;
        const classRecs = state.records.filter((r) => r.classId === c.id && r.studentId === sid);
        present += new Set(classRecs.map((r) => r.sessionId)).size;
        const histSessions = new Set(state.records.filter((r) => r.classId === c.id).map((r) => r.sessionId));
        const live = state.sessions.filter((s) => s.classId === c.id).length;
        total += histSessions.size + live;
      });
      return { student, present, total, pct: attendancePercentage(present, total) };
    }).sort((a, b) => b.pct - a.pct);
  }, [myClasses, state.records, state.sessions, state.users]);

  // Attendance trend over last 7 days
  const trend = useMemo(() => {
    const days: { label: string; pct: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const wd = d.getDay();
      const dayClasses = myClasses.filter((c) => c.day === wd);
      let present = 0, expected = 0;
      dayClasses.forEach((c) => {
        expected += c.studentIds.length;
        const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
        present += state.records.filter((r) =>
          r.classId === c.id && r.markedAt >= dayStart.getTime() && r.markedAt <= dayEnd.getTime()
        ).length;
      });
      days.push({
        label: WEEKDAYS[wd].slice(0, 3),
        pct: expected > 0 ? attendancePercentage(present, expected) : 0,
        count: present,
      });
    }
    return days;
  }, [myClasses, state.records]);

  // QR vs manual breakdown
  const methodBreakdown = useMemo(() => {
    const recs = state.records.filter((r) => myClasses.some((c) => c.id === r.classId));
    const qr = recs.filter((r) => r.method === 'qr').length;
    const manual = recs.filter((r) => r.method === 'manual').length;
    const total = qr + manual || 1;
    return { qr, manual, qrPct: Math.round((qr / total) * 100), manualPct: Math.round((manual / total) * 100) };
  }, [myClasses, state.records]);

  const overallAvg = classStats.length ? Math.round(classStats.reduce((a, c) => a + c.avg, 0) / classStats.length) : 0;
  const topStudent = studentStats[0];
  const atRisk = studentStats.filter((s) => s.pct < 75 && s.total > 0);

  if (myClasses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Visualize attendance trends across your classes." />
        <EmptyState icon={<BarChart3 size={22} />} title="No data to analyze yet" hint="Create classes and run attendance sessions to see analytics." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Attendance trends, method breakdown, and student rankings." />

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Average attendance" value={`${overallAvg}%`} icon={<TrendingUp size={18} />} tone={overallAvg >= 75 ? 'green' : 'amber'} />
        <StatCard label="Total records" value={state.records.filter((r) => myClasses.some((c) => c.id === r.classId)).length} icon={<BarChart3 size={18} />} tone="brand" />
        <StatCard label="Top student" value={topStudent?.student?.name.split(' ')[0] ?? '—'} icon={<Award size={18} />} tone="violet" sub={`${topStudent?.pct ?? 0}% attendance`} />
        <StatCard label="At-risk students" value={atRisk.length} icon={<AlertTriangle size={18} />} tone={atRisk.length > 0 ? 'rose' : 'green'} sub="Below 75%" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Trend chart */}
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900">7-day attendance trend</h2>
          <div className="mt-6 flex h-48 items-end justify-between gap-2">
            {trend.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-brand-500 to-brand-400 transition-all duration-500 hover:from-brand-600 hover:to-brand-500"
                    style={{ height: `${Math.max(d.pct, 2)}%` }}
                    title={`${d.pct}% · ${d.count} present`}
                  />
                </div>
                <span className="text-xs font-medium text-ink-500">{d.label}</span>
                <span className={`text-xs font-bold ${d.pct >= 75 ? 'text-accent-600' : d.pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Method breakdown */}
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Check-in method</h2>
          <div className="mt-6 space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-700">QR scan</span>
                <span className="text-ink-500">{methodBreakdown.qr} ({methodBreakdown.qrPct}%)</span>
              </div>
              <div className="mt-1.5"><ProgressBar value={methodBreakdown.qrPct} tone="brand" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-700">Manual code</span>
                <span className="text-ink-500">{methodBreakdown.manual} ({methodBreakdown.manualPct}%)</span>
              </div>
              <div className="mt-1.5"><ProgressBar value={methodBreakdown.manualPct} tone="brand" /></div>
            </div>
            <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-500">
              Total check-ins: <span className="font-bold text-ink-900">{methodBreakdown.qr + methodBreakdown.manual}</span> across all your classes.
            </div>
          </div>
        </div>
      </div>

      {/* Class comparison */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold text-ink-900">Class comparison</h2>
        <div className="mt-4 space-y-4">
          {classStats.map(({ class: c, avg, records }) => (
            <div key={c.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold text-ink-800">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /> {c.name}
                </span>
                <span className="text-ink-500">{records} records · {c.studentIds.length} students</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <ProgressBar value={avg} tone={avg >= 75 ? 'green' : avg >= 50 ? 'amber' : 'rose'} />
                <span className={`w-12 text-right font-bold ${avg >= 75 ? 'text-accent-600' : avg >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{avg}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student leaderboard */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">Student attendance ranking</h2>
          <Badge tone="brand"><Users size={12} /> {studentStats.length} students</Badge>
        </div>
        <div className="mt-4 space-y-1.5">
          {studentStats.map((s, i) => (
            <div key={s.student?.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-2.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'}`}>
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink-900">{s.student?.name}</div>
                <div className="text-xs text-ink-400">{s.student?.rollNo} · {s.present}/{s.total} sessions</div>
              </div>
              <div className="w-28"><ProgressBar value={s.pct} tone={s.pct >= 75 ? 'green' : s.pct >= 50 ? 'amber' : 'rose'} /></div>
              <span className={`w-10 text-right text-sm font-bold ${s.pct >= 75 ? 'text-accent-600' : s.pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
