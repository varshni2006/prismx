import type { SchoolClass, PlannerTask } from '@/types';

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}

export function todayISO(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(d = new Date()): number {
  return d.getDay();
}

export function classesForDay(classes: SchoolClass[], day: number): SchoolClass[] {
  return classes
    .filter((c) => c.day === day)
    .sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
}

/** Returns the FREE periods (gaps) between scheduled classes for a day. */
export interface FreePeriod {
  startTime: string;
  endTime: string;
  durationMin: number;
  before?: string; // class name after the free period
  after?: string; // class name before the free period
}

export function freePeriods(classes: SchoolClass[], day: number): FreePeriod[][] {
  // returns gaps per day; here we compute for a single day
  const dayClasses = classesForDay(classes, day);
  const gaps: FreePeriod[] = [];
  let prevEnd = 9 * 60; // school starts 9:00
  for (const c of dayClasses) {
    const s = toMin(c.startTime);
    if (s > prevEnd) {
      gaps.push({
        startTime: fromMin(prevEnd),
        endTime: c.startTime,
        durationMin: s - prevEnd,
        after: dayClasses.find((x) => toMin(x.endTime) === prevEnd)?.name,
        before: c.name,
      });
    }
    prevEnd = Math.max(prevEnd, toMin(c.endTime));
  }
  return [gaps];
}

function fromMin(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Rule-based study suggestions for a free period. */
export interface StudySuggestion {
  subject: string;
  title: string;
  reason: string;
  type: 'revise' | 'practice' | 'reading' | 'assignment' | 'break';
}

const SUBJECT_HINTS: Record<string, StudySuggestion[]> = {
  Algorithms: [
    { subject: 'Algorithms & DS', title: 'Solve 2 graph problems', reason: 'Reinforce today\'s lecture with focused practice.', type: 'practice' },
    { subject: 'Algorithms & DS', title: 'Revise Big-O cheat sheet', reason: 'Quick recall before the next class.', type: 'revise' },
  ],
  Systems: [
    { subject: 'Operating Systems', title: 'Review process scheduling notes', reason: 'Connects to the upcoming lecture topic.', type: 'revise' },
    { subject: 'Operating Systems', title: 'Practice semaphore problems', reason: 'High-yield for exams.', type: 'practice' },
  ],
  Databases: [
    { subject: 'Database Systems', title: 'Write 5 SQL queries', reason: 'Hands-on reps beat passive reading.', type: 'practice' },
    { subject: 'Database Systems', title: 'Read normalization chapter', reason: 'Foundational concept review.', type: 'reading' },
  ],
  Networks: [
    { subject: 'Computer Networks', title: 'Sketch the TCP handshake', reason: 'Visual recall cements the concept.', type: 'revise' },
    { subject: 'Computer Networks', title: 'Solve subnetting examples', reason: 'Frequent exam question type.', type: 'practice' },
  ],
  SE: [
    { subject: 'Software Engineering', title: 'Draft a user story for your project', reason: 'Apply today\'s concepts to real work.', type: 'assignment' },
    { subject: 'Software Engineering', title: 'Read Agile manifesto', reason: 'Short, high-signal reading.', type: 'reading' },
  ],
};

export function suggestionsForFreePeriod(free: { durationMin: number }, upcoming?: SchoolClass): StudySuggestion[] {
  const out: StudySuggestion[] = [];
  if (free.durationMin < 25) {
    out.push({
      subject: 'Wellbeing',
      title: 'Take a short break & hydrate',
      reason: 'Free period is too short for deep work — recharge instead.',
      type: 'break',
    });
    return out;
  }
  if (upcoming) {
    const hints = SUBJECT_HINTS[upcoming.subject] ?? [];
    out.push(...hints);
  }
  if (out.length === 0) {
    out.push({
      subject: 'General',
      title: 'Review this week\'s notes',
      reason: 'Consolidate recent material while you have a free slot.',
      type: 'revise',
    });
  }
  if (free.durationMin >= 60) {
    out.push({
      subject: 'General',
      title: 'Work on a pending assignment',
      reason: 'A full hour is enough for meaningful progress.',
      type: 'assignment',
    });
  }
  return out;
}

/** Attendance percentage for a student across a class or overall. */
export function attendancePercentage(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

/** Count how many sessions a class has had (from seeded + live). */
export function totalSessionsForClass(state: { sessions: { id: string; classId: string }[]; records: { sessionId: string; classId: string }[] }, classId: string): number {
  const live = state.sessions.filter((s) => s.classId === classId).length;
  // seeded historical sessions are inferred from unique sessionIds in records
  const histSessions = new Set(
    state.records.filter((r) => r.classId === classId).map((r) => r.sessionId)
  );
  // avoid double counting live sessions already in records
  const liveInRecords = new Set(
    state.records.filter((r) => r.classId === classId && state.sessions.some((s) => s.id === r.sessionId)).map((r) => r.sessionId)
  );
  return live + (histSessions.size - liveInRecords.size);
}
