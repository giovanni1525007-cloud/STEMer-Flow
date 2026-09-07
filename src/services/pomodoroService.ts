import type { PomodoroSettings, FocusHistoryEntry } from '@/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export const pomodoroService = {
  createFocusEntry(userId: string, subjectName: string, sessionTitle: string, duration: number): FocusHistoryEntry {
    const entry: FocusHistoryEntry = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      subjectName,
      sessionTitle,
      duration,
      completedAt: new Date().toISOString(),
    };
    return entry;
  },

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  },
};
