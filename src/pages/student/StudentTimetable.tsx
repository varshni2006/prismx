import { useState } from 'react';
import { CalendarDays, Clock, MapPin, Coffee } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PageHeader, Badge } from '@/components/ui';
import {
  WEEKDAYS, WEEKDAYS_SHORT, classesForDay, fmtTime, freePeriods,
} from '@/lib/schedule';
import type { SchoolClass } from '@/types';

interface TimelineRow {
  free: boolean;
  startTime: string;
  endTime: string;
  name?: string;
  code?: string;
  subject?: string;
  room?: string;
  color?: string;
  teacherName?: string;
  durationMin?: number;
  after?: string;
  before?: string;
}

export default function StudentTimetable() {
  const { currentUser, state } = useStore();
  const student = currentUser!;
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today);

  const myClasses = state.classes.filter((c) => student.classIds?.includes(c.id));
  const dayClasses = classesForDay(myClasses, selectedDay);
  const [gaps] = freePeriods(myClasses, selectedDay);

  const timeline: TimelineRow[] = [
    ...dayClasses.map((c: SchoolClass) => ({ ...c, free: false })),
    ...gaps.map((g) => ({ ...g, free: true })),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily timetable"
        subtitle="Your weekly schedule with automatic free-period detection."
      />

      {/* Day selector */}
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => setSelectedDay(i)}
            className={`btn px-4 py-2 text-sm ${selectedDay === i ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}
          >
            <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            <span className="hidden sm:inline">{d}</span>
            {i === today && <span className={`ml-1.5 h-1.5 w-1.5 rounded-full ${selectedDay === i ? 'bg-white' : 'bg-brand-500'}`} />}
          </button>
        ))}
      </div>

      {timeline.length === 0 ? (
        <div className="card p-10 text-center">
          <Coffee size={32} className="mx-auto text-ink-300" />
          <p className="mt-3 font-semibold text-ink-700">No classes on {WEEKDAYS[selectedDay]}</p>
          <p className="text-sm text-ink-400">Enjoy your free day or catch up on assignments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timeline.map((row, i) => (
            <div
              key={i}
              className={`card flex items-center gap-4 p-4 ${row.free ? 'border-amber-200 bg-amber-50/50' : ''}`}
            >
              <div className="flex w-20 shrink-0 flex-col text-sm">
                <span className="font-semibold text-ink-700">{fmtTime(row.startTime)}</span>
                <span className="text-xs text-ink-400">{fmtTime(row.endTime)}</span>
              </div>
              <div className={`h-12 w-1.5 rounded-full ${row.free ? 'bg-amber-400' : ''}`} style={!row.free ? { background: row.color } : undefined} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-display font-bold ${row.free ? 'text-amber-700' : 'text-ink-900'}`}>
                    {row.free ? 'FREE PERIOD' : row.name}
                  </span>
                  {row.free ? (
                    <Badge tone="amber"><Coffee size={11} /> Study slot</Badge>
                  ) : (
                    <Badge tone="gray">{row.code}</Badge>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-ink-400">
                  {!row.free && (
                    <>
                      <span className="flex items-center gap-1"><MapPin size={11} /> {row.room}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {row.subject}</span>
                      <span>{row.teacherName}</span>
                    </>
                  )}
                  {row.free && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {row.durationMin} min gap
                      {row.after ? ` after ${row.after}` : ''}
                      {row.before ? ` before ${row.before}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
