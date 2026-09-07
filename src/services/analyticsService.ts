import type { UserData, FocusHistoryEntry } from '@/types';

export const analyticsService = {
  getFocusByDay(focusHistory: FocusHistoryEntry[], days: number = 7): { date: string; minutes: number; label: string }[] {
    const result: { date: string; minutes: number; label: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const minutes = focusHistory
        .filter((h) => h.date === dateStr)
        .reduce((sum, h) => sum + h.duration, 0);
      result.push({
        date: dateStr,
        minutes,
        label: dayNames[date.getDay()],
      });
    }
    return result;
  },

  getFocusBySubject(focusHistory: FocusHistoryEntry[]): { subject: string; minutes: number }[] {
    const map: Record<string, number> = {};
    focusHistory.forEach((h) => {
      map[h.subjectName] = (map[h.subjectName] || 0) + h.duration;
    });
    return Object.entries(map)
      .map(([subject, minutes]) => ({ subject, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  },

  getWeeklyFocus(focusHistory: FocusHistoryEntry[]): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return focusHistory
      .filter((h) => new Date(h.date) >= weekAgo)
      .reduce((sum, h) => sum + h.duration, 0);
  },

  getMonthlyFocus(focusHistory: FocusHistoryEntry[]): number {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return focusHistory
      .filter((h) => new Date(h.date) >= monthAgo)
      .reduce((sum, h) => sum + h.duration, 0);
  },

  getCompletionRate(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const completed = sessions.filter((s) => s.completed).length;
    return Math.round((completed / sessions.length) * 100);
  },

  getAverageDaily(focusHistory: FocusHistoryEntry[]): number {
    if (focusHistory.length === 0) return 0;
    const days = new Set(focusHistory.map((h) => h.date)).size;
    const total = focusHistory.reduce((sum, h) => sum + h.duration, 0);
    return Math.round(total / days);
  },

  getMostStudiedSubject(focusHistory: FocusHistoryEntry[]): string {
    const bySubject = this.getFocusBySubject(focusHistory);
    return bySubject.length > 0 ? bySubject[0].subject : 'N/A';
  },

  getSessionsByDay(focusHistory: FocusHistoryEntry[], days: number = 7): { date: string; count: number; label: string }[] {
    const result: { date: string; count: number; label: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = focusHistory.filter((h) => h.date === dateStr).length;
      result.push({
        date: dateStr,
        count,
        label: dayNames[date.getDay()],
      });
    }
    return result;
  },
};
