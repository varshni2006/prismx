import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, QrCode, CalendarDays, ClipboardList, BookOpenCheck,
  Users, BarChart3, FileBarChart, LogOut, Menu, X, RotateCcw,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Avatar, Logo } from '@/components/ui';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const studentNav: NavItem[] = [
  { to: '/student-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/student/scan', label: 'Scan Attendance', icon: <QrCode size={18} /> },
  { to: '/student/timetable', label: 'Timetable', icon: <CalendarDays size={18} /> },
  { to: '/student/planner', label: 'Study Planner', icon: <ClipboardList size={18} /> },
  { to: '/student/attendance', label: 'My Attendance', icon: <BookOpenCheck size={18} /> },
];

const teacherNav: NavItem[] = [
  { to: '/teacher-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/teacher/classes', label: 'Classes', icon: <Users size={18} /> },
  { to: '/teacher/attendance', label: 'Take Attendance', icon: <QrCode size={18} /> },
  { to: '/teacher/reports', label: 'Reports', icon: <FileBarChart size={18} /> },
  { to: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, logout, resetDemo } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return <>{children}</>;
  const nav = currentUser.role === 'student' ? studentNav : teacherNav;
  const roleLabel = currentUser.role === 'student' ? 'Student' : 'Teacher';

  const doLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const doReset = () => {
    if (confirm('Reset all demo data to its initial state? This clears attendance, classes, and tasks.')) {
      resetDemo();
      navigate(currentUser.role === 'student' ? '/student-dashboard' : '/teacher-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden btn-ghost p-2"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to={currentUser.role === 'student' ? '/student-dashboard' : '/teacher-dashboard'}>
              <Logo size={34} />
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={doReset} className="btn-ghost hidden sm:inline-flex" title="Reset demo data">
              <RotateCcw size={16} /> <span className="hidden md:inline">Reset demo</span>
            </button>
            <div className="hidden items-center gap-2.5 sm:flex">
              <Avatar name={currentUser.name} color={currentUser.avatarColor} size={36} />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-ink-900">{currentUser.name}</div>
                <div className="text-xs text-ink-400">{roleLabel}{currentUser.rollNo ? ` · ${currentUser.rollNo}` : ''}</div>
              </div>
            </div>
            <button onClick={doLogout} className="btn-secondary">
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-ink-100 bg-white px-3 py-5 lg:block">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
            <div className="flex items-center gap-2 font-semibold text-ink-700">
              <GraduationCap size={14} /> Hackathon Demo
            </div>
            <p className="mt-1.5 leading-relaxed">All data is stored locally in your browser. Use Reset demo to restore the sample dataset.</p>
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />
            <div
              className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white p-4 shadow-ring animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <Logo size={32} />
                <button className="btn-ghost p-2" onClick={() => setMobileOpen(false)}><X size={18} /></button>
              </div>
              <nav className="flex flex-col gap-1">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                  >
                    {item.icon} {item.label}
                  </NavLink>
                ))}
              </nav>
              <button onClick={doReset} className="btn-ghost mt-4 w-full justify-start">
                <RotateCcw size={16} /> Reset demo data
              </button>
            </div>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
