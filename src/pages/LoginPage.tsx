import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { DEMO_PASSWORD } from '@/lib/storage';
import { Logo } from '@/components/ui';
import type { Role } from '@/types';

export default function LoginPage({ role }: { role: Role }) {
  const { login, state } = useStore();
  const navigate = useNavigate();
  const isStudent = role === 'student';

  const demoUser = state.users.find((u) => u.role === role);
  const [email, setEmail] = useState(demoUser?.email ?? '');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(role, email, password);
    if (res.ok) {
      navigate(role === 'student' ? '/student-dashboard' : '/teacher-dashboard', { replace: true });
    } else {
      setError(res.error ?? 'Login failed.');
    }
  };

  const fillDemo = () => {
    setEmail(demoUser?.email ?? '');
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-ink-900 via-brand-950 to-ink-900 p-10 text-white lg:flex">
          <div className="absolute -top-20 -right-10 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute bottom-0 -left-10 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
          <Link to="/" className="relative">
            <Logo size={38} />
          </Link>
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              <Sparkles size={13} /> {isStudent ? 'Student access' : 'Teacher access'}
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight">
              {isStudent
                ? 'Scan. Study. Stay on track.'
                : 'Run attendance in seconds.'}
            </h1>
            <p className="mt-4 max-w-sm text-ink-300">
              {isStudent
                ? 'Mark attendance with a QR, see your free periods, and get a smart study plan for the day.'
                : 'Create classes, generate QR sessions with expiry, and monitor live attendance across your roster.'}
            </p>
            <div className="mt-8 space-y-3">
              {(isStudent
                ? ['QR + manual code attendance', 'Auto-detected free periods', 'Rule-based study planner']
                : ['One-tap QR session with timer', 'Live present/absent monitoring', 'Per-class reports & analytics']
              ).map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-ink-200">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                    <ShieldCheck size={13} />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="relative text-xs text-ink-400">Demo only · data stays in your browser</div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-sm">
            <Link to="/" className="btn-ghost mb-6 -ml-2 inline-flex">
              <ArrowLeft size={16} /> Back
            </Link>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900">
              {isStudent ? 'Sign in as Student' : 'Sign in as Teacher'}
            </h2>
            <p className="mt-1.5 text-sm text-ink-500">
              Use the demo account below — password is <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs font-semibold text-ink-700">{DEMO_PASSWORD}</code>
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isStudent ? 'student1@demo.edu' : 'teacher@demo.edu'}
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    className="input pr-11"
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost p-1.5"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 animate-fade-in">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3">
                Sign in <ArrowRight size={16} />
              </button>
            </form>

            <button onClick={fillDemo} className="mt-4 w-full text-center text-sm text-brand-600 hover:text-brand-700">
              Autofill demo credentials
            </button>

            <div className="mt-8 rounded-xl border border-ink-100 bg-white p-4 text-sm">
              <div className="font-semibold text-ink-700">Demo accounts</div>
              <div className="mt-2 space-y-1.5 text-ink-500">
                <div className="flex justify-between"><span>Teacher</span><span className="font-mono text-ink-700">teacher@demo.edu</span></div>
                <div className="flex justify-between"><span>Student</span><span className="font-mono text-ink-700">student1@demo.edu</span></div>
                <div className="flex justify-between"><span>Password</span><span className="font-mono text-ink-700">{DEMO_PASSWORD}</span></div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-ink-500">
              {isStudent ? 'Are you a teacher?' : 'Are you a student?'}{' '}
              <Link to={isStudent ? '/login/teacher' : '/login/student'} className="font-semibold text-brand-600 hover:text-brand-700">
                {isStudent ? 'Teacher login' : 'Student login'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
