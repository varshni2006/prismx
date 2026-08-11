import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';

export function RequireRole({ role, children }: { role: 'student' | 'teacher'; children: ReactNode }) {
  const { currentUser } = useStore();
  const loc = useLocation();
  if (!currentUser) {
    return <Navigate to={role === 'student' ? '/login/student' : '/login/teacher'} state={{ from: loc.pathname }} replace />;
  }
  if (currentUser.role !== role) {
    return <Navigate to={currentUser.role === 'student' ? '/student-dashboard' : '/teacher-dashboard'} replace />;
  }
  return <>{children}</>;
}
