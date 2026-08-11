import { useEffect, useMemo, useState } from 'react';
import { QrCode, Clock, Play, StopCircle, RefreshCw, Users, CheckCircle2, KeyRound, Download } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PageHeader, Badge, EmptyState } from '@/components/ui';
import { makeQrDataUrl } from '@/lib/qr';
import { fmtTime } from '@/lib/schedule';

export default function TeacherAttendance() {
  const { currentUser, state, startAttendance, endSession, recordsForSession, classById } = useStore();
  const teacher = currentUser!;
  const myClasses = state.classes.filter((c) => c.teacherId === teacher.id);

  const [selectedClassId, setSelectedClassId] = useState<string>(myClasses[0]?.id ?? '');
  const [ttl, setTtl] = useState(5);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // tick for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeSession = useMemo(
    () => state.sessions.find((s) => s.status === 'active' && s.classId === selectedClassId),
    [state.sessions, selectedClassId]
  );

  // generate QR for active session
  useEffect(() => {
    if (!activeSession) {
      setQrUrl(null);
      return;
    }
    const payload = JSON.stringify({ sid: activeSession.id, code: activeSession.code, classId: activeSession.classId });
    let cancelled = false;
    makeQrDataUrl(payload).then((url) => {
      if (!cancelled) setQrUrl(url);
    });
    return () => { cancelled = true; };
  }, [activeSession?.id]);

  const startSession = () => {
    if (!selectedClassId) return;
    startAttendance(selectedClassId, ttl);
  };

  const endActive = () => {
    if (activeSession) endSession(activeSession.id);
  };

  const cls = selectedClassId ? classById(selectedClassId) : null;
  const enrolled = cls?.studentIds ?? [];
  const presentRecords = activeSession ? recordsForSession(activeSession.id) : [];
  const presentIds = new Set(presentRecords.map((r) => r.studentId));
  const presentCount = presentRecords.length;
  const absentCount = enrolled.length - presentCount;

  const left = activeSession ? Math.max(0, Math.ceil((activeSession.expiresAt - now) / 1000)) : 0;

  const exportCsv = () => {
    if (!activeSession || !cls) return;
    const rows = [['Roll No', 'Name', 'Status', 'Method', 'Time']];
    const students = state.users.filter((u) => cls.studentIds.includes(u.id));
    students.forEach((s) => {
      const rec = presentRecords.find((r) => r.studentId === s.id);
      rows.push([
        s.rollNo ?? '',
        s.name,
        rec ? 'Present' : 'Absent',
        rec?.method ?? '',
        rec ? new Date(rec.markedAt).toLocaleTimeString() : '',
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${cls.code}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Take attendance"
        subtitle="Generate a QR session with an expiry timer and monitor live attendance."
      />

      {myClasses.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="No classes to take attendance for"
          hint="Create a class first on the Classes page."
        />
      ) : (
        <>
          {/* Class selector */}
          <div className="card p-5">
            <label className="label">Select class</label>
            <div className="flex flex-wrap gap-2">
              {myClasses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`btn px-4 py-2 text-sm ${selectedClassId === c.id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
                </button>
              ))}
            </div>
          </div>

          {!activeSession ? (
            /* Start session form */
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-ink-900">Start a new attendance session</h2>
              <p className="mt-1 text-sm text-ink-500">A QR code and a 6-character manual code will be generated. Students can scan or enter the code before the timer expires.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Session length (minutes)</label>
                  <div className="flex flex-wrap gap-2">
                    {[3, 5, 10, 15].map((m) => (
                      <button
                        key={m}
                        onClick={() => setTtl(m)}
                        className={`btn px-4 py-2 text-sm ${ttl === m ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <button onClick={startSession} className="btn-primary w-full py-3">
                    <Play size={16} /> Generate QR & start
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active session */
            <div className="grid gap-5 lg:grid-cols-2">
              {/* QR panel */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-ink-900">{cls?.name}</h2>
                    <div className="text-sm text-ink-400">{cls?.code} · {fmtTime(cls?.startTime ?? '')} — {fmtTime(cls?.endTime ?? '')}</div>
                  </div>
                  <Badge tone="green"><span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-soft" /> Live</Badge>
                </div>

                <div className="mt-5 flex flex-col items-center">
                  <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
                    {qrUrl ? (
                      <img src={qrUrl} alt="Attendance QR code" width={220} height={220} className="rounded-lg" />
                    ) : (
                      <div className="flex h-[220px] w-[220px] items-center justify-center text-ink-300">
                        <RefreshCw size={28} className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5">
                    <KeyRound size={16} className="text-brand-300" />
                    <span className="font-mono text-xl font-bold tracking-[0.3em] text-white">{activeSession.code}</span>
                  </div>
                  <p className="mt-2 text-xs text-ink-400">Share this code with students for manual entry</p>
                </div>

                <div className="mt-5 rounded-xl border border-ink-100 bg-ink-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink-700"><Clock size={15} /> Time remaining</span>
                    <span className={`font-display text-xl font-bold ${left < 60 ? 'text-rose-600' : 'text-ink-900'}`}>
                      {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-200">
                    <div
                      className={`h-full rounded-full transition-all ${left < 60 ? 'bg-rose-500' : 'bg-brand-500'}`}
                      style={{ width: `${(left / (ttl * 60)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={endActive} className="btn-danger flex-1">
                    <StopCircle size={16} /> End session now
                  </button>
                  <button onClick={exportCsv} className="btn-secondary">
                    <Download size={16} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Live monitor */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-ink-900">Live attendance</h2>
                  <div className="flex gap-2">
                    <Badge tone="green"><CheckCircle2 size={12} /> {presentCount} present</Badge>
                    <Badge tone="rose">{absentCount} absent</Badge>
                  </div>
                </div>
                <div className="mt-4 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                  {enrolled.map((sid) => {
                    const student = state.users.find((u) => u.id === sid);
                    if (!student) return null;
                    const rec = presentRecords.find((r) => r.studentId === sid);
                    return (
                      <div key={sid} className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${rec ? 'border-accent-200 bg-accent-50/40' : 'border-ink-100'}`}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: student.avatarColor }}>
                          {student.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-ink-900">{student.name}</div>
                          <div className="text-xs text-ink-400">{student.rollNo}</div>
                        </div>
                        {rec ? (
                          <Badge tone="green">
                            {rec.method === 'qr' ? <QrCode size={11} /> : <KeyRound size={11} />} {rec.method === 'qr' ? 'QR' : 'Manual'} · {new Date(rec.markedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </Badge>
                        ) : (
                          <Badge tone="gray">Waiting</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
