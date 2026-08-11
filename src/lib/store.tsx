import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AppState, AttendanceRecord, AttendanceSession, PlannerTask, Role, SchoolClass, User,
} from '@/types';
import {
  clearAuth, DEMO_PASSWORD, loadAuth, loadState, resetState, saveAuth, saveState,
} from '@/lib/storage';

interface LoginResult {
  ok: boolean;
  error?: string;
}

interface StoreValue {
  state: AppState;
  currentUser: User | null;
  login: (role: Role, email: string, password: string) => LoginResult;
  logout: () => void;
  resetDemo: () => void;

  // teacher actions
  createClass: (input: Omit<SchoolClass, 'id' | 'teacherId' | 'teacherName' | 'studentIds' | 'color'> & { color?: string }) => SchoolClass;
  startAttendance: (classId: string, ttlMinutes: number) => AttendanceSession;
  endSession: (sessionId: string) => void;
  removeClass: (classId: string) => void;

  // student actions
  markAttendance: (sessionId: string, method: 'qr' | 'manual') => { ok: boolean; error?: string };
  addTask: (input: Omit<PlannerTask, 'id' | 'studentId' | 'done' | 'createdAt'>) => PlannerTask;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // selectors
  getSession: (id: string) => AttendanceSession | undefined;
  activeSessionForClass: (classId: string) => AttendanceSession | undefined;
  classById: (id: string) => SchoolClass | undefined;
  recordsForStudent: (studentId: string) => AttendanceRecord[];
  recordsForSession: (sessionId: string) => AttendanceRecord[];
  recordsForClass: (classId: string) => AttendanceRecord[];
}

const StoreContext = createContext<StoreValue | null>(null);

const PALETTE = ['#337bff', '#16b97f', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [auth, setAuth] = useState(() => loadAuth());
  const stateRef = useRef(state);
  stateRef.current = state;

  // persist on change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // auto-expire sessions tick
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setState((prev) => {
        const changed = prev.sessions.some((s) => s.status === 'active' && s.expiresAt < now);
        if (!changed) return prev;
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.status === 'active' && s.expiresAt < now ? { ...s, status: 'expired' as const } : s
          ),
        };
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === auth?.userId) ?? null,
    [state.users, auth]
  );

  const login = useCallback((role: Role, email: string, password: string): LoginResult => {
    if (password !== DEMO_PASSWORD) return { ok: false, error: 'Use the demo password: demo1234' };
    const user = stateRef.current.users.find(
      (u) => u.role === role && u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) return { ok: false, error: 'No demo account found for that email.' };
    const session = { userId: user.id, role };
    saveAuth(session);
    setAuth(session);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuth(null);
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = resetState();
    setState(fresh);
  }, []);

  const createClass: StoreValue['createClass'] = useCallback((input) => {
    const teacher = stateRef.current.users.find((u) => u.id === auth?.userId);
    const color = input.color || PALETTE[stateRef.current.classes.length % PALETTE.length];
    const cls: SchoolClass = {
      ...input,
      id: genId('c'),
      teacherId: teacher?.id ?? 't-1',
      teacherName: teacher?.name ?? 'Teacher',
      studentIds: stateRef.current.users.filter((u) => u.role === 'student').map((u) => u.id),
      color,
    };
    setState((prev) => ({
      ...prev,
      classes: [...prev.classes, cls],
      users: prev.users.map((u) =>
        u.role === 'student' ? { ...u, classIds: [...(u.classIds ?? []), cls.id] } : u
      ),
    }));
    return cls;
  }, [auth?.userId]);

  const startAttendance: StoreValue['startAttendance'] = useCallback((classId, ttlMinutes) => {
    const cls = stateRef.current.classes.find((c) => c.id === classId);
    const now = Date.now();
    const session: AttendanceSession = {
      id: genId('ses'),
      classId,
      className: cls?.name ?? 'Class',
      teacherId: auth?.userId ?? 't-1',
      code: genCode(),
      createdAt: now,
      expiresAt: now + ttlMinutes * 60_000,
      status: 'active',
    };
    setState((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
    return session;
  }, [auth?.userId]);

  const endSession: StoreValue['endSession'] = useCallback((sessionId) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, status: 'expired' } : s)),
    }));
  }, []);

  const removeClass: StoreValue['removeClass'] = useCallback((classId) => {
    setState((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== classId),
      users: prev.users.map((u) =>
        u.role === 'student'
          ? { ...u, classIds: (u.classIds ?? []).filter((id) => id !== classId) }
          : u
      ),
    }));
  }, []);

  const markAttendance: StoreValue['markAttendance'] = useCallback((sessionId, method) => {
    const studentId = auth?.userId;
    if (!studentId) return { ok: false, error: 'Not signed in.' };
    const session = stateRef.current.sessions.find((s) => s.id === sessionId);
    if (!session) return { ok: false, error: 'Session not found.' };
    if (session.status !== 'active') return { ok: false, error: 'This attendance session has expired.' };
    if (Date.now() > session.expiresAt) return { ok: false, error: 'Session expired.' };
    const already = stateRef.current.records.find(
      (r) => r.sessionId === sessionId && r.studentId === studentId
    );
    if (already) return { ok: false, error: 'You already marked attendance for this session.' };
    const student = stateRef.current.users.find((u) => u.id === studentId);
    if (!student) return { ok: false, error: 'Student record missing.' };
    const rec: AttendanceRecord = {
      id: genId('rec'),
      sessionId,
      classId: session.classId,
      studentId,
      studentName: student.name,
      rollNo: student.rollNo ?? '',
      markedAt: Date.now(),
      method,
    };
    setState((prev) => ({ ...prev, records: [...prev.records, rec] }));
    return { ok: true };
  }, [auth?.userId]);

  const addTask: StoreValue['addTask'] = useCallback((input) => {
    const studentId = auth?.userId ?? '';
    const task: PlannerTask = {
      ...input,
      id: genId('task'),
      studentId,
      done: false,
      createdAt: Date.now(),
    };
    setState((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    return task;
  }, [auth?.userId]);

  const toggleTask: StoreValue['toggleTask'] = useCallback((taskId) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    }));
  }, []);

  const deleteTask: StoreValue['deleteTask'] = useCallback((taskId) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }));
  }, []);

  const getSession = useCallback((id: string) => stateRef.current.sessions.find((s) => s.id === id), []);
  const activeSessionForClass = useCallback(
    (classId: string) => stateRef.current.sessions.find((s) => s.classId === classId && s.status === 'active'),
    []
  );
  const classById = useCallback((id: string) => stateRef.current.classes.find((c) => c.id === id), []);
  const recordsForStudent = useCallback(
    (studentId: string) => stateRef.current.records.filter((r) => r.studentId === studentId),
    []
  );
  const recordsForSession = useCallback(
    (sessionId: string) => stateRef.current.records.filter((r) => r.sessionId === sessionId),
    []
  );
  const recordsForClass = useCallback(
    (classId: string) => stateRef.current.records.filter((r) => r.classId === classId),
    []
  );

  const value: StoreValue = {
    state,
    currentUser,
    login,
    logout,
    resetDemo,
    createClass,
    startAttendance,
    endSession,
    removeClass,
    markAttendance,
    addTask,
    toggleTask,
    deleteTask,
    getSession,
    activeSessionForClass,
    classById,
    recordsForStudent,
    recordsForSession,
    recordsForClass,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
