import { Link } from 'react-router-dom';
import {
  QrCode, CalendarDays, ClipboardList, BookOpenCheck, Clock, TrendingUp, Sparkles, ArrowRight,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { StatCard, ProgressBar, Badge, PageHeader } from '@/components/ui';
import {
  WEEKDAYS, classesForDay, fmtTime, freePeriods, suggestionsForFreePeriod, attendancePercentage,
} from '@/lib/schedule';

export default function StudentDashboard() {
  const { currentUser, state, recordsForStudent, classById } = useStore();
  const student = currentUser!;
  const today = new Date();
  const wd = today.getDay();

  const myClasses = state.classes.filter((c) => student.classIds?.includes(c.id));
  const todayClasses = classesForDay(myClasses, wd);
  const [gaps] = freePeriods(myClasses, wd);

  const records = recordsForStudent(student.id);
  // overall attendance: present sessions / total sessions (from history + live)
  const totalSessions = new Set(records.map((r) => r.sessionId)).size;
  // expected total = sum of sessions per enrolled class
  const expectedTotal = myClasses.reduce((acc, c) => {
    const classRecs = state.records.filter((r) => r.classId === c.id);
    const histSessions = new Set(classRecs.map((r) => r.sessionId));
    const live = state.sessions.filter((s) => s.classId === c.id).length;
    return acc + histSessions.size + live;
  }, 0);
  const pct = attendancePercentage(totalSessions, expectedTotal);

  const nowMin = today.getHours() * 60 + today.getMinutes();
  const nextClass = todayClasses.find((c) => {
    const [h, m] = c.startTime.split(':').map(Number);
    return h * 60 + m > nowMin;
  });
  const currentFree = gaps.find((g) => {
    const [sh, sm] = g.startTime.split(':').map(Number);
    const [eh, em] = g.endTime.split(':').map(Number);
    return nowMin >= sh * 60 + sm && nowMin < eh * 60 + em;
  });

  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-7">
      <PageHeader
        title={`${greeting}, ${student.name.split(' ')[0]}`}
        subtitle={`${WEEKDAYS[wd]} · ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
        action={
          <Link to="/student/scan" className="btn-primary">
            <QrCode size={16} /> Scan attendance
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          value={`${pct}%`}
          icon={<TrendingUp size={18} />}
          tone={pct >= 75 ? 'green' : pct >= 50 ? 'amber' : 'rose'}
          sub={`${totalSessions} of ${expectedTotal} sessions`}
        />
        <StatCard label="Enrolled" value={myClasses.length} icon={<BookOpenCheck size={18} />} tone="brand" />
        <StatCard label="Today's classes" value={todayClasses.length} icon={<CalendarDays size={18} />} tone="violet" />
        <StatCard label="Free periods today" value={gaps.length} icon={<Clock size={18} />} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Today's timetable */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900">Today's timetable</h2>
            <Link to="/student/timetable" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View full
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {todayClasses.length === 0 && gaps.length === 0 && (
              <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
                No classes scheduled today. Enjoy your day!
              </div>
            )}
            {buildTimeline(todayClasses, gaps).map((row, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border p-3 ${row.free ? 'border-amber-200 bg-amber-50/60' : 'border-ink-100 bg-white'}`}
              >
                <div className={`h-9 w-1.5 rounded-full ${row.free ? 'bg-amber-400' : 'bg-ink-300'}`} style={!row.free ? { background: row.color } : undefined} />
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${row.free ? 'text-amber-700' : 'text-ink-900'}`}>
                    {row.free ? 'FREE PERIOD' : row.name}
                  </div>
                  <div className="text-xs text-ink-400">
                    {fmtTime(row.startTime)} — {fmtTime(row.endTime)}
                    {!row.free && row.room ? ` · ${row.room}` : ''}
                  </div>
                </div>
                {row.free ? (
                  <Badge tone="amber">Study slot</Badge>
                ) : (
                  <Badge tone="gray">{row.code}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column: next up + quick actions */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-ink-900">Up next</h2>
            {nextClass ? (
              <div className="mt-3 rounded-xl border border-ink-100 p-4" style={{ background: `${nextClass.color}10` }}>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">Next class</div>
                <div className="mt-1 text-base font-bold text-ink-900">{nextClass.name}</div>
                <div className="text-sm text-ink-500">{fmtTime(nextClass.startTime)} — {fmtTime(nextClass.endTime)} · {nextClass.room}</div>
              </div>
            ) : currentFree ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">Free now</div>
                <div className="mt-1 text-base font-bold text-amber-800">{fmtTime(currentFree.startTime)} — {fmtTime(currentFree.endTime)}</div>
                <div className="text-sm text-amber-700">{currentFree.durationMin} min available</div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-400">
                No more classes today.
              </div>
            )}
          </div>

          {currentFree && (
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-600" />
                <h2 className="font-display text-lg font-bold text-ink-900">Study suggestion</h2>
              </div>
              <div className="mt-3 space-y-2">
                {suggestionsForFreePeriod(currentFree, nextClass).slice(0, 2).map((s, i) => (
                  <div key={i} className="rounded-xl border border-ink-100 p-3">
                    <div className="text-sm font-semibold text-ink-900">{s.title}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{s.reason}</div>
                  </div>
                ))}
                <Link to="/student/planner" className="btn-ghost w-full justify-between">
                  Open planner <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-ink-900">Quick actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Link to="/student/scan" className="btn-secondary flex-col h-auto py-3">
                <QrCode size={18} /> Scan QR
              </Link>
              <Link to="/student/planner" className="btn-secondary flex-col h-auto py-3">
                <ClipboardList size={18} /> Planner
              </Link>
              <Link to="/student/attendance" className="btn-secondary flex-col h-auto py-3">
                <BookOpenCheck size={18} /> Attendance
              </Link>
              <Link to="/student/timetable" className="btn-secondary flex-col h-auto py-3">
                <CalendarDays size={18} /> Timetable
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance by class */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold text-ink-900">Attendance by class</h2>
        <div className="mt-4 space-y-3">
          {myClasses.map((c) => {
            const myRecs = records.filter((r) => r.classId === c.id);
            const present = new Set(myRecs.map((r) => r.sessionId)).size;
            const classRecs = state.records.filter((r) => r.classId === c.id);
            const histSessions = new Set(classRecs.map((r) => r.sessionId));
            const live = state.sessions.filter((s) => s.classId === c.id).length;
            const total = histSessions.size + live;
            const p = attendancePercentage(present, total);
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-800">{c.name}</span>
                  <span className={`font-semibold ${p >= 75 ? 'text-accent-600' : p >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{p}%</span>
                </div>
                <div className="mt-1.5"><ProgressBar value={p} tone={p >= 75 ? 'green' : p >= 50 ? 'amber' : 'rose'} /></div>
                <div className="mt-1 text-xs text-ink-400">{present}/{total} sessions · {c.code}</div>
              </div>
            );
          })}
          {myClasses.length === 0 && (
            <div className="text-sm text-ink-400">You are not enrolled in any classes yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildTimeline(
  classes: { id: string; name: string; code: string; startTime: string; endTime: string; color: string; room: string }[],
  gaps: { startTime: string; endTime: string }[]
) {
  const rows: any[] = [];
  const all = [
    ...classes.map((c) => ({ ...c, free: false })),
    ...gaps.map((g) => ({ ...g, free: true, name: 'FREE PERIOD', code: '', color: '', room: '' })),
  ];
  return all.sort((a, b) => a.startTime.localeCompare(b.startTime));
}
