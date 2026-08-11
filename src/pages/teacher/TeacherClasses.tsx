import { useState } from 'react';
import { Plus, Users, MapPin, Clock, Trash2, X, CalendarDays } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PageHeader, Badge, EmptyState } from '@/components/ui';
import { WEEKDAYS, WEEKDAYS_SHORT, fmtTime } from '@/lib/schedule';

const COLORS = ['#337bff', '#16b97f', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function TeacherClasses() {
  const { currentUser, state, createClass, removeClass } = useStore();
  const teacher = currentUser!;
  const myClasses = state.classes.filter((c) => c.teacherId === teacher.id);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    subject: '',
    room: '',
    day: new Date().getDay(),
    startTime: '09:00',
    endTime: '10:00',
    color: COLORS[0],
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    createClass({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      subject: form.subject.trim() || form.name.trim(),
      room: form.room.trim(),
      day: form.day,
      startTime: form.startTime,
      endTime: form.endTime,
      color: form.color,
    });
    setForm({ ...form, name: '', code: '', subject: '', room: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My classes"
        subtitle="Create and manage your class roster."
        action={
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Plus size={16} /> {showForm ? 'Close' : 'Create class'}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={submit} className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900">Create a new class</h2>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost p-1.5"><X size={18} /></button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Class name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Data Structures" required autoFocus />
            </div>
            <div>
              <label className="label">Class code</label>
              <input className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS201" maxLength={8} required />
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Algorithms & DS" />
            </div>
            <div>
              <label className="label">Room</label>
              <input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. B-204" />
            </div>
            <div>
              <label className="label">Day</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, day: i })}
                    className={`btn px-3 py-1.5 text-xs ${form.day === i ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
                  >
                    {WEEKDAYS_SHORT[i]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start</label>
                <input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="label">End</label>
                <input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Color tag</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-8 w-8 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-ink-400' : ''}`}
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="submit" className="btn-primary"><Plus size={16} /> Create class</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {myClasses.length === 0 && !showForm ? (
        <EmptyState
          icon={<Users size={22} />}
          title="No classes yet"
          hint="Create your first class to start taking attendance."
          action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Create class</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myClasses.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <div className="h-1.5" style={{ background: c.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink-900">{c.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone="gray">{c.code}</Badge>
                      <Badge tone="brand">{c.subject}</Badge>
                    </div>
                  </div>
                  {confirmDelete === c.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => { removeClass(c.id); setConfirmDelete(null); }} className="btn-danger px-3 py-1.5 text-xs">Delete</button>
                      <button onClick={() => setConfirmDelete(null)} className="btn-ghost px-2 py-1.5 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(c.id)} className="btn-ghost p-1.5 text-ink-400 hover:text-rose-600"><Trash2 size={16} /></button>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-500">
                  <span className="flex items-center gap-1.5"><Users size={14} /> {c.studentIds.length} students</span>
                  <span className="flex items-center gap-1.5"><MapPin size={14} /> {c.room || '—'}</span>
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {WEEKDAYS_SHORT[c.day]}</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {fmtTime(c.startTime)} — {fmtTime(c.endTime)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
