import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, KeyRound, CheckCircle2, AlertCircle, Camera, RefreshCw, Clock } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PageHeader, Badge } from '@/components/ui';
import { fmtTime } from '@/lib/schedule';

type Mode = 'scan' | 'manual';
type Status = 'idle' | 'success' | 'error';

export default function StudentScanPage() {
  const { state, currentUser, markAttendance, classById } = useStore();
  const [mode, setMode] = useState<Mode>('scan');
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<number | null>(null);

  const myClasses = state.classes.filter((c) => currentUser?.classIds?.includes(c.id));
  const activeSessions = useMemo(
    () => state.sessions.filter((s) => s.status === 'active' && myClasses.some((c) => c.id === s.classId)),
    [state.sessions, myClasses]
  );

  const stopCamera = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setCameraError(null);
    setStatus('idle');
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      pollRef.current = window.setInterval(() => scanFrame(), 1200);
    } catch (e: any) {
      setCameraError(e?.message || 'Could not access camera. Use manual code instead.');
      setMode('manual');
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    // We don't ship a QR decoder library (no external deps policy for scanning libs).
    // Instead, the camera preview is live; students can also use manual code or
    // tap one of the active sessions below to "scan" it. This keeps the demo fully
    // functional offline without a heavy dependency.
  };

  const submitSession = (sessionId: string, method: 'qr' | 'manual') => {
    const res = markAttendance(sessionId, method);
    if (res.ok) {
      setStatus('success');
      setMessage('Attendance marked successfully!');
      stopCamera();
    } else {
      setStatus('error');
      setMessage(res.error ?? 'Could not mark attendance.');
    }
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    const session = state.sessions.find(
      (s) => s.status === 'active' && s.code.toUpperCase() === code
    );
    if (!session) {
      setStatus('error');
      setMessage('No active session matches that code. Check and try again.');
      return;
    }
    submitSession(session.id, 'manual');
  };

  const reset = () => {
    setStatus('idle');
    setMessage('');
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark attendance"
        subtitle="Scan the QR code shown by your teacher, or enter the session code manually."
      />

      {status === 'success' && (
        <div className="card flex flex-col items-center justify-center gap-3 p-10 text-center animate-scale-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="font-display text-xl font-bold text-ink-900">You're marked present</h2>
          <p className="text-sm text-ink-500">{message}</p>
          <div className="mt-2 flex gap-2">
            <Link to="/student/attendance" className="btn-primary">View attendance</Link>
            <button onClick={reset} className="btn-secondary">Mark another</button>
          </div>
        </div>
      )}

      {status !== 'success' && (
        <>
          {/* Mode toggle */}
          <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1">
            <button
              onClick={() => { setMode('scan'); stopCamera(); reset(); }}
              className={`btn ${mode === 'scan' ? 'bg-brand-600 text-white' : 'text-ink-600'} px-4 py-2`}
            >
              <QrCode size={16} /> Scan QR
            </button>
            <button
              onClick={() => { setMode('manual'); stopCamera(); reset(); }}
              className={`btn ${mode === 'manual' ? 'bg-brand-600 text-white' : 'text-ink-600'} px-4 py-2`}
            >
              <KeyRound size={16} /> Manual code
            </button>
          </div>

          {mode === 'scan' && (
            <div className="card p-6">
              <div className="mx-auto max-w-md">
                <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50">
                  <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                  {!scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-400">
                      <Camera size={40} />
                      <p className="text-sm">Camera preview will appear here</p>
                    </div>
                  )}
                  {scanning && (
                    <>
                      <div className="absolute inset-8 rounded-xl border-2 border-brand-500/70" />
                      <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-brand-500 animate-pulse-soft" />
                    </>
                  )}
                </div>

                {cameraError && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {!scanning ? (
                    <button onClick={startCamera} className="btn-primary flex-1">
                      <Camera size={16} /> Start camera
                    </button>
                  ) : (
                    <button onClick={stopCamera} className="btn-secondary flex-1">
                      Stop camera
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs text-ink-400">
                  No QR decoder? Tap a live session below to simulate a successful scan.
                </p>
              </div>
            </div>
          )}

          {mode === 'manual' && (
            <div className="card p-6">
              <form onSubmit={submitManual} className="mx-auto max-w-md space-y-4">
                <div>
                  <label className="label" htmlFor="code">Session code</label>
                  <input
                    id="code"
                    className="input text-center text-lg font-mono tracking-[0.3em] uppercase"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="ABC123"
                    maxLength={6}
                    autoFocus
                  />
                </div>
                {status === 'error' && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 animate-fade-in">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}
                <button type="submit" className="btn-primary w-full">
                  <KeyRound size={16} /> Submit code
                </button>
              </form>
            </div>
          )}

          {/* Active sessions for this student */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink-900">Active attendance sessions</h2>
              <Badge tone="green"><span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-soft" /> Live</Badge>
            </div>
            <div className="mt-4 space-y-2.5">
              {activeSessions.length === 0 && (
                <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
                  No active attendance sessions right now. Ask your teacher to start one.
                </div>
              )}
              {activeSessions.map((s) => {
                const cls = classById(s.classId);
                const left = Math.max(0, Math.ceil((s.expiresAt - Date.now()) / 1000));
                return (
                  <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-ink-900">{cls?.name}</div>
                      <div className="text-xs text-ink-400">
                        Code <span className="font-mono font-semibold text-ink-700">{s.code}</span> · expires in {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => submitSession(s.id, 'qr')} className="btn-primary">
                        <QrCode size={15} /> Mark via QR
                      </button>
                      <button onClick={() => submitSession(s.id, 'manual')} className="btn-secondary">
                        <KeyRound size={15} /> Manual
                      </button>
                    </div>
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
