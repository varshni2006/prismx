import { useMemo, useState } from 'react';
import { ClipboardList, Plus, Check, Trash2, Sparkles, Clock, BookOpen, Coffee } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PageHeader, Badge, EmptyState } from '@/components/ui';
import {
  WEEKDAYS, classesForDay, fmtTime, freePeriods, suggestionsForFreePeriod, todayISO,
} from '@/lib/schedule';

export default function StudentPlanner() {
  const { currentUser, state, addTask, toggleTask, deleteTask } = useStore();
  const student = currentUser!;
  const today = new Date().getDay();
  const todayDate = todayISO();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');

  const myClasses = state.classes.filter((c) => student.classIds?.includes(c.id));
  const todayClasses = classesForDay(myClasses, today);
  const [gaps] = freePeriods(myClasses, today);

  const myTasks = useMemo(
    () => state.tasks.filter((t) => t.studentId === student.id).sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt),
    [state.tasks, student.id]
  );
  const todaysTasks = myTasks.filter((t) => t.date === todayDate);
  const doneCount = todaysTasks.filter((t) => t.done).length;

  // Auto-generated suggestions for today's free periods
  const suggestions = useMemo(() => {
    const out: { suggestion: typeof suggestionsForFreePeriod extends infer S ? any : never; period: string; durationMin: number }[] = [];
    gaps.forEach((g) => {
      const upcoming = todayClasses.find((c) => c.startTime >= g.endTime);
      suggestionsForFreePeriod(g, upcoming).forEach((s) => {
        out.push({ suggestion: s, period: `${fmtTime(g.startTime)}-${fmtTime(g.endTime)}`, durationMin: g.durationMin });
      });
    });
    return out;
  }, [gaps, todayClasses]);

  const addSuggestion = (s: any, period: string) => {
    addTask({
      title: s.title,
      subject: s.subject,
      date: todayDate,
      period,
      reason: s.reason,
    });
    setShowAdd(false);
  };

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      subject: subject.trim() || 'General',
      date: todayDate,
      period: 'Anytime',
      reason: 'Manually added task.',
    });
    setTitle('');
    setSubject('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study planner"
        subtitle={`${WEEKDAYS[today]} · ${todaysTasks.length} task${todaysTasks.length === 1 ? '' : 's'} today · ${doneCount} done`}
        action={
          <button onClick={() => setShowAdd((v) => !v)} className="btn-primary">
            <Plus size={16} /> Add task
          </button>
        }
      />

      {showAdd && (
        <form onSubmit={submitCustom} className="card p-5 animate-fade-in">
          <h2 className="font-display text-lg font-bold text-ink-900">Add a study task</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Task</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Revise sorting algorithms" autoFocus />
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Algorithms & DS" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary"><Plus size={16} /> Save task</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Smart suggestions */}
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brand-600" />
          <h2 className="font-display text-lg font-bold text-ink-900">Smart suggestions for today's free periods</h2>
        </div>
        {suggestions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
            <Coffee size={20} className="mx-auto mb-2 text-ink-300" />
            No free periods today — check back on another day.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {suggestions.map((s, i) => (
              <div key={i} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-ink-900">{s.suggestion.title}</div>
                    <div className="mt-0.5 text-xs text-ink-500">{s.suggestion.reason}</div>
                  </div>
                  <Badge tone="brand">{s.suggestion.type}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-ink-400 flex items-center gap-1">
                    <Clock size={11} /> {s.period} · {s.durationMin} min
                  </span>
                  <button onClick={() => addSuggestion(s.suggestion, s.period)} className="btn-ghost text-brand-600 p-1.5">
                    <Plus size={14} /> Add to planner
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's tasks */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold text-ink-900">Today's tasks</h2>
        <div className="mt-4 space-y-2.5">
          {todaysTasks.length === 0 && (
            <EmptyState
              icon={<ClipboardList size={20} />}
              title="No tasks yet"
              hint="Add a task or pick a suggestion from your free periods above."
            />
          )}
          {todaysTasks.map((t) => (
            <div key={t.id} className={`flex items-center gap-3 rounded-xl border p-3.5 transition ${t.done ? 'border-accent-200 bg-accent-50/40' : 'border-ink-100 bg-white'}`}>
              <button
                onClick={() => toggleTask(t.id)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${t.done ? 'border-accent-500 bg-accent-500 text-white' : 'border-ink-300 hover:border-brand-500'}`}
                aria-label={t.done ? 'Mark as not done' : 'Mark as done'}
              >
                {t.done && <Check size={14} strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold ${t.done ? 'text-ink-400 line-through' : 'text-ink-900'}`}>{t.title}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-400 mt-0.5">
                  <span className="flex items-center gap-1"><BookOpen size={11} /> {t.subject}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {t.period}</span>
                </div>
              </div>
              <button onClick={() => deleteTask(t.id)} className="btn-ghost p-1.5 text-ink-400 hover:text-rose-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* All tasks (other days) */}
      {myTasks.filter((t) => t.date !== todayDate).length > 0 && (
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Other tasks</h2>
          <div className="mt-4 space-y-2.5">
            {myTasks.filter((t) => t.date !== todayDate).map((t) => (
              <div key={t.id} className={`flex items-center gap-3 rounded-xl border p-3.5 ${t.done ? 'border-accent-200 bg-accent-50/40' : 'border-ink-100'}`}>
                <button
                  onClick={() => toggleTask(t.id)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${t.done ? 'border-accent-500 bg-accent-500 text-white' : 'border-ink-300'}`}
                >
                  {t.done && <Check size={14} strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${t.done ? 'text-ink-400 line-through' : 'text-ink-900'}`}>{t.title}</div>
                  <div className="text-xs text-ink-400">{t.subject} · {t.date}</div>
                </div>
                <button onClick={() => deleteTask(t.id)} className="btn-ghost p-1.5 text-ink-400 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
