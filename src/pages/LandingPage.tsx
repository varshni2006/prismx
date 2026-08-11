import { Link } from 'react-router-dom';
import {
  QrCode, CalendarDays, ClipboardList, BarChart3, Users, BookOpenCheck,
  ShieldCheck, Zap, ArrowRight, Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/ui';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      {/* Nav */}
      <header className="border-b border-ink-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={36} />
          <div className="flex items-center gap-2">
            <Link to="/login/student" className="btn-ghost">Student</Link>
            <Link to="/login/teacher" className="btn-ghost">Teacher</Link>
            <Link to="/login/student" className="btn-primary">
              Get started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-ink-50" />
        <div className="absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute top-40 -left-20 -z-10 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <Sparkles size={13} /> Hackathon-ready classroom toolkit
              </div>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
                Smart attendance &<br />
                <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">study planner</span> in one place
              </h1>
              <p className="mt-5 max-w-md text-lg text-ink-500">
                Teachers run QR-based attendance sessions. Students scan to mark presence, spot free periods, and get rule-based study suggestions — all from a clean dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/login/teacher" className="btn-primary px-5 py-3">
                  I'm a Teacher <ArrowRight size={16} />
                </Link>
                <Link to="/login/student" className="btn-secondary px-5 py-3">
                  I'm a Student
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-4 text-xs text-ink-400">
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> localStorage only</span>
                <span className="flex items-center gap-1.5"><Zap size={14} /> No backend setup</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> Demo accounts ready</span>
              </div>
            </div>

            {/* Mock dashboard preview */}
            <div className="relative animate-scale-in">
              <div className="card overflow-hidden p-0">
                <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <div className="ml-2 text-xs font-medium text-ink-400">student dashboard</div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[['Attendance', '86%', 'brand'], ['Classes', '5', 'green'], ['Free now', '1', 'amber']].map(([l, v, t]) => (
                      <div key={l} className={`rounded-xl border border-ink-100 p-3 ${t === 'brand' ? 'bg-brand-50' : t === 'green' ? 'bg-accent-50' : 'bg-amber-50'}`}>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{l}</div>
                        <div className="mt-1 text-xl font-bold text-ink-900">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      { n: 'Data Structures', t: '09:00 — 10:00', c: 'bg-brand-500' },
                      { n: 'FREE PERIOD', t: '10:00 — 11:00', c: 'bg-amber-400' },
                      { n: 'Operating Systems', t: '11:00 — 12:00', c: 'bg-accent-500' },
                    ].map((row) => (
                      <div key={row.n} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                        <div className={`h-8 w-1.5 rounded-full ${row.c}`} />
                        <div className="flex-1">
                          <div className={`text-sm font-semibold ${row.n.includes('FREE') ? 'text-amber-600' : 'text-ink-800'}`}>{row.n}</div>
                          <div className="text-xs text-ink-400">{row.t}</div>
                        </div>
                        {row.n.includes('FREE') && <span className="chip bg-amber-50 text-amber-700">Study suggestion</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -right-5 hidden rotate-3 sm:block">
                <div className="card flex items-center gap-2 px-4 py-3">
                  <QrCode size={20} className="text-brand-600" />
                  <div className="text-xs font-semibold text-ink-700">Scan to mark present</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink-900">Everything a classroom needs</h2>
          <p className="mt-2 text-ink-500">Two focused dashboards, one shared workflow.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <QrCode />, t: 'QR Attendance', d: 'Teachers generate a session QR with an expiry timer. Students scan or enter a manual code.' },
            { icon: <BarChart3 />, t: 'Live Monitoring', d: 'See who has marked present in real time and export per-class reports.' },
            { icon: <CalendarDays />, t: 'Daily Timetable', d: 'Students see today\'s schedule with classes and gaps at a glance.' },
            { icon: <BookOpenCheck />, t: 'Free-Period Detection', d: 'Gaps between classes are auto-detected and surfaced as study slots.' },
            { icon: <ClipboardList />, t: 'Study Planner', d: 'Rule-based suggestions turn free time into focused tasks you can check off.' },
            { icon: <Users />, t: 'Role-Based Access', d: 'Separate student and teacher routes with guarded navigation and logout.' },
          ].map((f) => (
            <div key={f.t} className="card p-6 transition hover:shadow-ring">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{f.icon}</div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{f.t}</h3>
              <p className="mt-1.5 text-sm text-ink-500">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-brand-950 px-8 py-12 text-center text-white sm:px-16">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Try it with one click</h2>
          <p className="mx-auto mt-3 max-w-md text-ink-300">Demo accounts are preloaded with realistic classes and 14 days of attendance history.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/login/teacher" className="btn bg-white px-5 py-3 text-ink-900 hover:bg-ink-100">
              Teacher demo <ArrowRight size={16} />
            </Link>
            <Link to="/login/student" className="btn border border-white/30 bg-white/10 px-5 py-3 text-white hover:bg-white/20">
              Student demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-ink-400 sm:flex-row sm:px-6">
          <Logo size={28} />
          <p>Built for a hackathon · localStorage-only · React + TypeScript + Tailwind</p>
        </div>
      </footer>
    </div>
  );
}
