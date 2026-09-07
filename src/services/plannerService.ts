import type { StudySession, SharedTask, PlannerItem, PlanDay, Priority } from '@/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function dateToStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function daysBetween(dateStr: string | null): number {
  if (!dateStr) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface WorkItem {
  id: string;
  type: 'session' | 'task';
  refId: string;
  title: string;
  subjectName?: string;
  duration: number;
  priority: Priority;
  deadline: string | null;
  allowSplitting: boolean;
}

export const plannerService = {
  generatePlan(
    sessions: StudySession[],
    tasks: SharedTask[],
    startDate: Date,
    numDays: number,
  existingPlans: PlannerItem[] = []
  ): PlanDay[] {
    // Collect uncompleted work
    const workItems: WorkItem[] = [];

    sessions
      .filter((s) => !s.completed)
      .forEach((s) => {
        workItems.push({
          id: generateId(),
          type: 'session',
          refId: s.id,
          title: s.title,
          subjectName: s.subjectName,
          duration: s.duration,
          priority: s.priority,
          deadline: s.deadline,
          allowSplitting: s.allowSplitting,
        });
      });

    tasks
      .filter((t) => !t.completed)
      .forEach((t) => {
        workItems.push({
          id: generateId(),
          type: 'task',
          refId: t.id,
          title: t.title,
          duration: t.duration,
          priority: t.priority,
          deadline: t.deadline,
          allowSplitting: false,
        });
      });

    // Sort by priority (deadline urgency boosts priority)
    workItems.sort((a, b) => {
      const aUrgency = a.deadline ? Math.max(0, 10 - daysBetween(a.deadline)) : 0;
      const bUrgency = b.deadline ? Math.max(0, 10 - daysBetween(b.deadline)) : 0;
      const aScore = PRIORITY_WEIGHT[a.priority] + aUrgency;
      const bScore = PRIORITY_WEIGHT[b.priority] + bUrgency;
      return bScore - aScore;
    });

    // Split large sessions if allowed
    const expandedItems: WorkItem[] = [];
    workItems.forEach((item) => {
      if (item.allowSplitting && item.duration > 120 && numDays > 1) {
        // Split across days but avoid tiny fragments
        const numSplits = Math.min(numDays, Math.ceil(item.duration / 90));
        const chunkSize = Math.floor(item.duration / numSplits);
        const remainder = item.duration - chunkSize * numSplits;
        for (let i = 0; i < numSplits; i++) {
          expandedItems.push({
            ...item,
            id: `${item.id}_split_${i}`,
            duration: chunkSize + (i === 0 ? remainder : 0),
          });
        }
      } else {
        expandedItems.push(item);
      }
    });

    // Initialize days
    const days: PlanDay[] = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push({
        date: dateToStr(date),
        items: [],
        totalMinutes: 0,
        completedMinutes: 0,
      });
    }

    // Distribute work evenly using a greedy approach
    // Sort expanded items by priority again
    expandedItems.sort((a, b) => {
      const aUrgency = a.deadline ? Math.max(0, 10 - daysBetween(a.deadline)) : 0;
      const bUrgency = b.deadline ? Math.max(0, 10 - daysBetween(b.deadline)) : 0;
      const aScore = PRIORITY_WEIGHT[a.priority] + aUrgency;
      const bScore = PRIORITY_WEIGHT[b.priority] + bUrgency;
      return bScore - aScore;
    });

    expandedItems.forEach((item) => {
      // Find the day with the least load that is before the deadline (if any)
      let bestDayIndex = 0;
      let minLoad = Infinity;

      const deadlineDayIndex = item.deadline
        ? days.findIndex((d) => d.date === dateToStr(new Date(item.deadline!)))
        : -1;

      for (let i = 0; i < days.length; i++) {
        // Skip days past the deadline
        if (deadlineDayIndex >= 0 && i > deadlineDayIndex) continue;
        if (days[i].totalMinutes < minLoad) {
          minLoad = days[i].totalMinutes;
          bestDayIndex = i;
        }
      }

      const plannerItem: PlannerItem = {
        id: generateId(),
        type: item.type,
        refId: item.refId,
        title: item.title,
        subjectName: item.subjectName,
        duration: item.duration,
        priority: item.priority,
        date: days[bestDayIndex].date,
        isSplit: item.id.includes('_split_'),
        originalDuration: item.id.includes('_split_') ? workItems.find((w) => w.id === item.id.split('_split_')[0])?.duration : undefined,
      };

      days[bestDayIndex].items.push(plannerItem);
      days[bestDayIndex].totalMinutes += item.duration;
    });

    return days;
  },

  moveItem(days: PlanDay[], itemId: string, targetDate: string): PlanDay[] {
    let movedItem: PlannerItem | undefined;
    const updatedDays = days.map((day) => {
      const itemIndex = day.items.findIndex((item) => item.id === itemId);
      if (itemIndex >= 0) {
        movedItem = day.items[itemIndex];
        const newItems = [...day.items];
        newItems.splice(itemIndex, 1);
        return {
          ...day,
          items: newItems,
          totalMinutes: day.totalMinutes - day.items[itemIndex].duration,
        };
      }
      return day;
    });

    const item = movedItem;
    if (item) {
      const targetIndex = updatedDays.findIndex((d) => d.date === targetDate);
      if (targetIndex >= 0) {
        const updatedItem = { ...item, date: targetDate };
        updatedDays[targetIndex].items.push(updatedItem);
        updatedDays[targetIndex].totalMinutes += item.duration;
      }
    }

    return updatedDays;
  },
};
