import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider, useStore } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { RequireRole } from '@/components/RequireRole';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentScanPage from '@/pages/student/StudentScanPage';
import StudentTimetable from '@/pages/student/StudentTimetable';
import StudentPlanner from '@/pages/student/StudentPlanner';
import StudentAttendance from '@/pages/student/StudentAttendance';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import TeacherClasses from '@/pages/teacher/TeacherClasses';
import TeacherAttendance from '@/pages/teacher/TeacherAttendance';
import TeacherReports from '@/pages/teacher/TeacherReports';
import TeacherAnalytics from '@/pages/teacher/TeacherAnalytics';

function RootRedirect() {
  const { currentUser } = useStore();
  if (currentUser?.role === 'student') return <Navigate to="/student-dashboard" replace />;
  if (currentUser?.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
  return <LandingPage />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login/student" element={<LoginPage role="student" />} />
          <Route path="/login/teacher" element={<LoginPage role="teacher" />} />

          {/* Student routes */}
          <Route path="/student-dashboard" element={<RequireRole role="student"><Shell><StudentDashboard /></Shell></RequireRole>} />
          <Route path="/student/scan" element={<RequireRole role="student"><Shell><StudentScanPage /></Shell></RequireRole>} />
          <Route path="/student/timetable" element={<RequireRole role="student"><Shell><StudentTimetable /></Shell></RequireRole>} />
          <Route path="/student/planner" element={<RequireRole role="student"><Shell><StudentPlanner /></Shell></RequireRole>} />
          <Route path="/student/attendance" element={<RequireRole role="student"><Shell><StudentAttendance /></Shell></RequireRole>} />

          {/* Teacher routes */}
          <Route path="/teacher-dashboard" element={<RequireRole role="teacher"><Shell><TeacherDashboard /></Shell></RequireRole>} />
          <Route path="/teacher/classes" element={<RequireRole role="teacher"><Shell><TeacherClasses /></Shell></RequireRole>} />
          <Route path="/teacher/attendance" element={<RequireRole role="teacher"><Shell><TeacherAttendance /></Shell></RequireRole>} />
          <Route path="/teacher/reports" element={<RequireRole role="teacher"><Shell><TeacherReports /></Shell></RequireRole>} />
          <Route path="/teacher/analytics" element={<RequireRole role="teacher"><Shell><TeacherAnalytics /></Shell></RequireRole>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
