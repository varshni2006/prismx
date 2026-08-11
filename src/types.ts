export type Role = 'student' | 'teacher';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  avatarColor: string;
  /** teacher only */
  department?: string;
  /** student only */
  rollNo?: string;
  classIds?: string[];
}

export interface SchoolClass {
  id: string;
  name: string;
  code: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
  color: string;
  /** student ids enrolled */
  studentIds: string[];
  /** weekday 0-6 (Sun-Sat) */
  day: number;
  /** 24h start/end e.g. "09:00" */
  startTime: string;
  endTime: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'expired';
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  classId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  markedAt: number;
  method: 'qr' | 'manual';
}

export interface PlannerTask {
  id: string;
  studentId: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  period: string; // e.g. "11:00-12:00"
  reason: string; // why suggested
  done: boolean;
  createdAt: number;
}

export interface AppState {
  users: User[];
  classes: SchoolClass[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  tasks: PlannerTask[];
}
