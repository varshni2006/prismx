import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
}

export function Avatar({ name, color, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="font-display font-extrabold text-ink-900 text-lg tracking-tight">CampusPulse</div>
        <div className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold">Smart Attendance</div>
      </div>
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  tone?: 'brand' | 'green' | 'amber' | 'rose' | 'gray' | 'violet';
}
export function Badge({ children, tone = 'gray' }: BadgeProps) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-accent-50 text-accent-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    gray: 'bg-ink-100 text-ink-600',
    violet: 'bg-violet-50 text-violet-700',
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

export function StatCard({
  label, value, icon, tone = 'brand', sub,
}: { label: string; value: ReactNode; icon: ReactNode; tone?: 'brand' | 'green' | 'amber' | 'rose' | 'violet'; sub?: string }) {
  const tones: Record<string, string> = {
    brand: 'from-brand-500/10 to-brand-500/0 text-brand-700',
    green: 'from-accent-500/10 to-accent-500/0 text-accent-700',
    amber: 'from-amber-500/10 to-amber-500/0 text-amber-700',
    rose: 'from-rose-500/10 to-rose-500/0 text-rose-700',
    violet: 'from-violet-500/10 to-violet-500/0 text-violet-700',
  };
  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</div>
          <div className="mt-1.5 text-2xl font-display font-bold text-ink-900">{value}</div>
          {sub && <div className="text-xs text-ink-400 mt-0.5">{sub}</div>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'green' | 'amber' | 'rose' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-500',
    green: 'bg-accent-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className={`h-full rounded-full ${tones[tone]} transition-all duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">{icon}</div>
      <div className="mt-3 font-semibold text-ink-700">{title}</div>
      {hint && <div className="mt-1 text-sm text-ink-400 max-w-sm">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function LinkButton({ to, children, variant = 'primary' }: { to: string; children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' }) {
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-ghost';
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  );
}
