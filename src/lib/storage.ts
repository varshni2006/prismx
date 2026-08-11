import type { AppState, User, SchoolClass, PlannerTask, AttendanceRecord } from '@/types';

const STORAGE_KEY = 'campuspulse.state.v1';
const SESSION_KEY = 'campuspulse.session.v1';

export const DEMO_PASSWORD = 'demo1234';

const COLORS = ['#337bff', '#16b97f', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

function pickColor(i: number) {
  return COLORS[i % COLORS.length];
}

function rollNo(i: number) {
  return `CS${String(21 + (i % 4)).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`;
}

function buildDemoState(): AppState {
  const teacher: User = {
    id: 't-1',
    role: 'teacher',
    name: 'Dr. Anita Rao',
    email: 'teacher@demo.edu',
    avatarColor: '#1c5cf5',
    department: 'Computer Science',
  };

  const studentNames = [
    'Aarav Sharma', 'Diya Patel', 'Kabir Singh', 'Meera Iyer', 'Vivaan Gupta',
    'Ananya Reddy', 'Arjun Nair', 'Ishita Verma', 'Reyansh Das', 'Sara Khan',
  ];

  const students: User[] = studentNames.map((name, i) => ({
    id: `s-${i + 1}`,
    role: 'student',
    name,
    email: `student${i + 1}@demo.edu`,
    avatarColor: pickColor(i + 2),
    rollNo: rollNo(i),
    classIds: [],
  }));

  const today = new Date().getDay(); // 0 Sun .. 6 Sat
  // Ensure at least some classes land on today for live timetable feel
  const dayFor = (offset: number) => (today + offset + 7) % 7;

  const classes: SchoolClass[] = [
    {
      id: 'c-1', name: 'Data Structures', code: 'CS201', subject: 'Algorithms & DS',
      teacherId: teacher.id, teacherName: teacher.name, room: 'B-204', color: '#337bff',
      studentIds: students.map((s) => s.id), day: dayFor(0), startTime: '09:00', endTime: '10:00',
    },
    {
      id: 'c-2', name: 'Operating Systems', code: 'CS302', subject: 'Systems',
      teacherId: teacher.id, teacherName: teacher.name, room: 'A-110', color: '#16b97f',
      studentIds: students.slice(0, 8).map((s) => s.id), day: dayFor(0), startTime: '11:00', endTime: '12:00',
    },
    {
      id: 'c-3', name: 'Database Systems', code: 'CS303', subject: 'Databases',
      teacherId: teacher.id, teacherName: teacher.name, room: 'C-301', color: '#f59e0b',
      studentIds: students.map((s) => s.id), day: dayFor(1), startTime: '14:00', endTime: '15:00',
    },
    {
      id: 'c-4', name: 'Computer Networks', code: 'CS305', subject: 'Networks',
      teacherId: teacher.id, teacherName: teacher.name, room: 'B-102', color: '#8b5cf6',
      studentIds: students.slice(2, 10).map((s) => s.id), day: dayFor(2), startTime: '10:00', endTime: '11:00',
    },
    {
      id: 'c-5', name: 'Software Engineering', code: 'CS401', subject: 'SE',
      teacherId: teacher.id, teacherName: teacher.name, room: 'A-205', color: '#06b6d4',
      studentIds: students.map((s) => s.id), day: dayFor(3), startTime: '15:00', endTime: '16:00',
    },
  ];

  students.forEach((s) => {
    s.classIds = classes.filter((c) => c.studentIds.includes(s.id)).map((c) => c.id);
  });

  // Seed historical attendance for the past 14 days for percentage calc
  const records = seedHistory(classes, students);

  const tasks: PlannerTask[] = [];

  return { users: [teacher, ...students], classes, sessions: [], records, tasks };
}

function seedHistory(classes: SchoolClass[], students: User[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const now = Date.now();
  for (let d = 1; d <= 14; d++) {
    const day = new Date(now - d * 86400000);
    const wd = day.getDay();
    for (const c of classes) {
      if (c.day !== wd) continue;
      const sessionBase = day.getTime() + parseMin(c.startTime) * 60000;
      const sid = `hs-${c.id}-${d}`;
      for (const sid0 of c.studentIds) {
        const stu = students.find((s) => s.id === sid0)!;
        // ~85% attendance rate, deterministic-ish with a little variance
        const present = ((d * 7 + Number(stu.id.slice(-1)) * 3) % 10) < 8;
        if (!present) continue;
        records.push({
          id: `hr-${sid}-${stu.id}`,
          sessionId: sid,
          classId: c.id,
          studentId: stu.id,
          studentName: stu.name,
          rollNo: stu.rollNo!,
          markedAt: sessionBase + Math.floor(Math.random() * 300000),
          method: Math.random() > 0.5 ? 'qr' : 'manual',
        });
      }
    }
  }
  return records;
}

function parseMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      // basic shape check
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.classes)) {
        // expire any leftover active sessions
        const now = Date.now();
        parsed.sessions = (parsed.sessions || []).map((s) =>
          s.expiresAt < now ? { ...s, status: 'expired' as const } : s
        );
        return parsed;
      }
    }
  } catch {
    // fall through
  }
  const fresh = buildDemoState();
  saveState(fresh);
  return fresh;
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  const fresh = buildDemoState();
  saveState(fresh);
  return fresh;
}

/* ---- Auth session (current logged-in user id + role) ---- */
export interface AuthSession {
  userId: string;
  role: 'student' | 'teacher';
}

export function loadAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveAuth(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuth() {
  localStorage.removeItem(SESSION_KEY);
}
