import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, List } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { pomodoroService } from '@/services/pomodoroService';
import type { StudySession, SharedTask } from '@/types';

interface CalendarItem {
  id: string;
  title: string;
  type: 'session' | 'task';
  date: string;
  priority: string;
  duration: number;
  subjectName?: string;
  completed: boolean;
  ref: StudySession | SharedTask;
}

export function Calendar() {
  const { data, updateSession, updateSharedTask } = useAppData();
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [newDate, setNewDate] = useState('');

  const allItems = useMemo<CalendarItem[]>(() => {
    const items: CalendarItem[] = [];
    data.sessions.forEach((s) => {
      if (s.deadline || s.scheduledDate) {
        items.push({
          id: s.id,
          title: s.title,
          type: 'session',
          date: s.scheduledDate || s.deadline || '',
          priority: s.priority,
          duration: s.duration,
          subjectName: s.subjectName,
          completed: s.completed,
          ref: s,
        });
      }
    });
    data.sharedTasks.forEach((t) => {
      if (t.deadline || t.scheduledDate) {
        items.push({
          id: t.id,
          title: t.title,
          type: 'task',
          date: t.scheduledDate || t.deadline || '',
          priority: t.priority,
          duration: t.duration,
          completed: t.completed,
          ref: t,
        });
      }
    });
    return items;
  }, [data.sessions, data.sharedTasks]);

  const getItemsForDate = (dateStr: string) => allItems.filter((item) => item.date === dateStr);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handleMoveItem = () => {
    if (!selectedItem || !newDate) return;
    if (selectedItem.type === 'session') {
      updateSession(selectedItem.id, { scheduledDate: newDate });
    } else {
      updateSharedTask(selectedItem.id, { scheduledDate: newDate });
    }
    setSelectedItem(null);
    setNewDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
          <p className="text-text-muted mt-1">View and manage your scheduled items.</p>
        </div>
        <Tabs
          tabs={[
            { id: 'month', label: 'Month', icon: <CalIcon className="w-4 h-4" /> },
            { id: 'week', label: 'Week', icon: <CalIcon className="w-4 h-4" /> },
            { id: 'agenda', label: 'Agenda', icon: <List className="w-4 h-4" /> },
          ]}
          active={view}
          onChange={setView}
        />
      </div>

      {view === 'month' && (
        <Card className="p-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-text-muted py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
              const items = getItemsForDate(dateStr);
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              return (
                <div
                  key={day}
                  className={`aspect-square p-1 rounded-lg border transition-all ${
                    isToday ? 'border-brand-blue bg-brand-blue/5' : 'border-transparent hover:bg-surface-hover'
                  }`}
                >
                  <p className={`text-xs ${isToday ? 'font-bold text-brand-blue' : 'text-text-secondary'} mb-1`}>{day}</p>
                  <div className="space-y-0.5">
                    {items.slice(0, 2).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate transition-colors ${
                          item.completed ? 'bg-accent-success/10 text-accent-success line-through' :
                          item.priority === 'high' ? 'bg-accent-error/10 text-accent-error' :
                          item.priority === 'medium' ? 'bg-accent-warning/10 text-accent-warning' :
                          'bg-brand-blue/10 text-brand-blue'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                    {items.length > 2 && (
                      <p className="text-[10px] text-text-muted px-1.5">+{items.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === 'week' && <WeekView items={allItems} currentDate={currentDate} onSelect={setSelectedItem} />}
      {view === 'agenda' && <AgendaView items={allItems} onSelect={setSelectedItem} />}

      {/* Item detail modal */}
      <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title="Item Details" size="sm">
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-text-primary">{selectedItem.title}</h3>
              <p className="text-sm text-text-muted">
                {selectedItem.subjectName || 'Shared Task'} · {pomodoroService.formatDuration(selectedItem.duration)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={selectedItem.priority === 'high' ? 'error' : selectedItem.priority === 'medium' ? 'warning' : 'default'}>
                {selectedItem.priority}
              </Badge>
              <Badge variant={selectedItem.completed ? 'success' : 'default'}>
                {selectedItem.completed ? 'Completed' : 'Pending'}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Move to date</label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleMoveItem} disabled={!newDate}>
              Move Item
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function WeekView({ items, currentDate, onSelect }: { items: CalendarItem[]; currentDate: Date; onSelect: (item: CalendarItem) => void }) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      {Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayItems = items.filter((item) => item.date === dateStr);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
          <Card key={i} className="p-3 min-h-[150px]">
            <p className="text-xs font-medium text-text-muted mb-2">
              {dayNames[i]} {date.getDate()}
            </p>
            <div className="space-y-1">
              {dayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={`w-full text-left px-2 py-1 rounded-lg text-xs truncate transition-colors ${
                    item.completed ? 'bg-accent-success/10 text-accent-success line-through' :
                    item.priority === 'high' ? 'bg-accent-error/10 text-accent-error' :
                    item.priority === 'medium' ? 'bg-accent-warning/10 text-accent-warning' :
                    'bg-brand-blue/10 text-brand-blue'
                  }`}
                >
                  {item.title}
                </button>
              ))}
              {dayItems.length === 0 && <p className="text-xs text-text-muted text-center py-2">No items</p>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AgendaView({ items, onSelect }: { items: CalendarItem[]; onSelect: (item: CalendarItem) => void }) {
  const sorted = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (sorted.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CalIcon className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
        <p className="text-sm text-text-muted">No scheduled items. Set deadlines or schedule sessions to see them here.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {sorted.map((item) => (
        <Card key={item.id} hover className="p-3" onClick={() => onSelect(item)}>
          <div className="flex items-center gap-3">
            <div className="text-center flex-shrink-0 w-16">
              <p className="text-xs text-text-muted">{new Date(item.date).toLocaleDateString('en', { month: 'short' })}</p>
              <p className="text-lg font-bold text-text-primary">{new Date(item.date).getDate()}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium text-text-primary truncate ${item.completed ? 'line-through' : ''}`}>{item.title}</p>
              <p className="text-xs text-text-muted">{item.subjectName || 'Shared Task'} · {pomodoroService.formatDuration(item.duration)}</p>
            </div>
            <Badge variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'}>
              {item.priority}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
