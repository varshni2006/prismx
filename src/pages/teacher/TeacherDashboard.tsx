import { Link } from 'react-router-dom';
import {
  Users, QrCode, FileBarChart, BarChart3, Plus, ArrowRight, Activity, Clock,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { StatCard, PageHeader, Badge, ProgressBar } from '@/components/ui';
import { WEEKDAYS, classesForDay, fmtTime, attendancePercentage } from '@/lib/schedule';

export default function TeacherDashboard() {
  const { currentUser, state, recordsForClass, activeSessionForClass } = useStore();
  const teacher = currentUser!;
  const today = new Date().getDay();

  const myClasses = state.classes.filter((c) => c.teacherId === teacher.id);
  const todayClasses = classesForDay(myClasses, today);
  const totalStudents = new Set(myClasses.flatMap((c) => c.studentIds)).size;
  const activeSessions = myClasses
    .map((c) => activeSessionForClass(c.id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const totalRecords = state.records.filter((r) => myClasses.some((c) => c.id === r.classId)).length;

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-7">
      <PageHeader
        title={`${greeting}, ${teacher.name.split(' ').slice(-1)[0]}`}
        subtitle={`${teacher.department} · ${WEEKDAYS[today]}`}
        action={
          <Link to="/teacher/attendance" className="btn-primary">
            <QrCode size={16} /> Start attendance
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My classes" value={myClasses.length} icon={<Users size={18} />} tone="brand" />
        <StatCard label="Total students" value={totalStudents} icon={<Users size={18} />} tone="violet" />
        <StatCard label="Active sessions" value={activeSessions.length} icon={<Activity size={18} />} tone={activeSessions.length > 0 ? 'green' : 'amber'} />
        <StatCard label="Attendance records" value={totalRecords} icon={<FileBarChart size={18} />} tone="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Today's classes */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900">Today's classes</h2>
            <Link to="/teacher/classes" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Manage classes</Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {todayClasses.length === 0 && (
              <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
                No classes scheduled today.
              </div>
            )}
            {todayClasses.map((c) => {
              const active = activeSessionForClass(c.id);
              const recs = recordsForClass(c.id);
              const present = new Set(recs.filter((r) => r.classId === c.id).map((r) => r.studentId)).size;
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-4">
                  <div className="h-10 w-1.5 rounded-full" style={{ background: c.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink-900">{c.name}</span>
                      <Badge tone="gray">{c.code}</Badge>
                      {active && <Badge tone="green"><span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-soft" /> Live</Badge>}
                    </div>
                    <div className="text-xs text-ink-400">{fmtTime(c.startTime)} — {fmtTime(c.endTime)} · {c.room} · {c.studentIds.length} students</div>
                  </div>
                  <Link to="/teacher/attendance" className="btn-secondary">
                    <QrCode size={15} /> Attendance
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-ink-900">Quick actions</h2>
            <div className="mt-3 space-y-2.5">
              <Link to="/teacher/classes" className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2"><Plus size={16} /> Create class</span> <ArrowRight size={14} />
              </Link>
              <Link to="/teacher/attendance" className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2"><QrCode size={16} /> Start attendance</span> <ArrowRight size={14} />
              </Link>
              <Link to="/teacher/reports" className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2"><FileBarChart size={16} /> View reports</span> <ArrowRight size={14} />
              </Link>
              <Link to="/teacher/analytics" className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2"><BarChart3 size={16} /> Analytics</span> <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {activeSessions.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-accent-600" />
                <h2 className="font-display text-lg font-bold text-ink-900">Live now</h2>
              </div>
              <div className="mt-3 space-y-2">
                {activeSessions.map((s) => {
                  const cls = myClasses.find((c) => c.id === s.classId);
                  const left = Math.max(0, Math.ceil((s.expiresAt - Date.now()) / 1000));
                  return (
                    <div key={s.id} className="rounded-xl border border-accent-200 bg-accent-50/40 p-3">
                      <div className="font-semibold text-ink-900">{cls?.name}</div>
                      <div className="text-xs text-ink-500 flex items-center gap-1"><Clock size={11} /> Expires in {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</div>
                      <Link to="/teacher/attendance" className="btn-ghost mt-2 w-full justify-between text-accent-700">
                        Monitor <ArrowRight size={14} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Class overview */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold text-ink-900">Class overview</h2>
        <div className="mt-4 space-y-4">
          {myClasses.map((c) => {
            const recs = recordsForClass(c.id);
            const presentStudents = new Set(recs.map((r) => r.studentId)).size;
            const avg = attendancePercentage(presentStudents, c.studentIds.length);
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-ink-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /> {c.name}
                  </span>
                  <span className="text-ink-500">{c.studentIds.length} students · {recs.length} records</span>
                </div>
                <div className="mt-1.5"><ProgressBar value={avg} tone="brand" /></div>
              </div>
            );
          })}
          {myClasses.length === 0 && <div className="text-sm text-ink-400">No classes yet. Create your first class.</div>}
        </div>
      </div>
    </div>
  );
}
