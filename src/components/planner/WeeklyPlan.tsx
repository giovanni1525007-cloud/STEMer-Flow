import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext, type DragEndEvent, DragOverlay, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { Calendar, Clock, List, CalendarDays, GitBranch, CheckCircle2 } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState } from '@/components/ui/EmptyState';
import { pomodoroService } from '@/services/pomodoroService';
import type { PlannerItem } from '@/types';

export function WeeklyPlan() {
  const { data, movePlanItem } = useAppData();
  const { showToast } = useToast();
  const [view, setView] = useState('list');
  const [activeItem, setActiveItem] = useState<PlannerItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const currentPlan = data.weeklyPlans[0];

  if (!currentPlan) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Weekly Plan</h1>
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="No plan generated yet"
          description="Head to the Smart Planner to generate your first study plan."
        />
      </div>
    );
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveItem(null);
    if (over && active.id !== over.id) {
      const targetDate = over.id as string;
      movePlanItem(currentPlan.id, active.id as string, targetDate);
      showToast('Item moved', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Weekly Plan</h1>
          <p className="text-text-muted mt-1">
            Starting {new Date(currentPlan.startDate).toLocaleDateString()} · {currentPlan.days.length} days
          </p>
        </div>
        <Tabs
          tabs={[
            { id: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
            { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-4 h-4" /> },
            { id: 'timeline', label: 'Timeline', icon: <GitBranch className="w-4 h-4" /> },
          ]}
          active={view}
          onChange={setView}
        />
      </div>

      <DndContext sensors={sensors} onDragStart={(e) => {
        const item = currentPlan.days.flatMap(d => d.items).find(i => i.id === e.active.id);
        setActiveItem(item || null);
      }} onDragEnd={handleDragEnd}>
        {view === 'list' && <ListView plan={currentPlan} />}
        {view === 'calendar' && <CalendarView plan={currentPlan} />}
        {view === 'timeline' && <TimelineView plan={currentPlan} />}
        <DragOverlay>
          {activeItem && (
            <div className="glass-strong rounded-xl p-3 shadow-2xl max-w-xs">
              <p className="text-sm font-medium text-text-primary">{activeItem.title}</p>
              <p className="text-xs text-text-muted">{pomodoroService.formatDuration(activeItem.duration)}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function DraggableItem({ item }: { item: PlannerItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-xl bg-bg-secondary border border-border cursor-grab hover:border-brand-blue/30 transition-all ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
          {item.subjectName && <p className="text-xs text-text-muted">{item.subjectName}</p>}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {pomodoroService.formatDuration(item.duration)}
            </span>
            <Badge variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'}>
              {item.priority}
            </Badge>
            {item.isSplit && <Badge variant="purple">Split</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableDay({ day, children }: { day: any; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: day.date });
  return (
    <div ref={setNodeRef} className={`transition-all ${isOver ? 'bg-brand-blue/5' : ''}`}>
      {children}
    </div>
  );
}

function ListView({ plan }: { plan: any }) {
  return (
    <div className="space-y-4">
      {plan.days.map((day: any, i: number) => {
        const completion = day.totalMinutes > 0 ? Math.round((day.completedMinutes / day.totalMinutes) * 100) : 0;
        return (
          <DroppableDay key={day.date} day={day}>
            <Card delay={i * 0.05} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {pomodoroService.formatDuration(day.totalMinutes)} planned · {completion}% complete
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-text-primary">{day.items.length}</p>
                  <p className="text-xs text-text-muted">items</p>
                </div>
              </div>
              <ProgressBar value={completion} className="mb-3" />
              {day.items.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">No items planned</p>
              ) : (
                <div className="space-y-2">
                  {day.items.map((item: PlannerItem) => (
                    <DraggableItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </Card>
          </DroppableDay>
        );
      })}
    </div>
  );
}

function CalendarView({ plan }: { plan: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {plan.days.map((day: any, i: number) => (
        <DroppableDay key={day.date} day={day}>
          <Card delay={i * 0.03} className="p-4 min-h-[200px]">
            <div className="mb-3">
              <p className="text-xs text-text-muted">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </p>
              <p className="text-lg font-bold text-text-primary">
                {new Date(day.date).getDate()}
              </p>
              <p className="text-xs text-text-muted">{pomodoroService.formatDuration(day.totalMinutes)}</p>
            </div>
            <div className="space-y-2">
              {day.items.map((item: PlannerItem) => (
                <DraggableItem key={item.id} item={item} />
              ))}
              {day.items.length === 0 && <p className="text-xs text-text-muted text-center py-4">Free</p>}
            </div>
          </Card>
        </DroppableDay>
      ))}
    </div>
  );
}

function TimelineView({ plan }: { plan: any }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-6">
        {plan.days.map((day: any, i: number) => (
          <DroppableDay key={day.date} day={day}>
            <div className="relative pl-12">
              <div className="absolute left-2 top-2 w-5 h-5 rounded-full bg-brand-blue border-4 border-bg-primary z-10" />
              <Card delay={i * 0.05} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary text-sm">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <span className="text-xs text-text-muted">{pomodoroService.formatDuration(day.totalMinutes)}</span>
                </div>
                <div className="space-y-2">
                  {day.items.map((item: PlannerItem) => (
                    <DraggableItem key={item.id} item={item} />
                  ))}
                  {day.items.length === 0 && <p className="text-xs text-text-muted text-center py-2">Free day</p>}
                </div>
              </Card>
            </div>
          </DroppableDay>
        ))}
      </div>
    </div>
  );
}
