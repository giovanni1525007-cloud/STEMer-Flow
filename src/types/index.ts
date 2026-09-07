export type Grade = 'Grade 10' | 'Grade 11' | 'Grade 12';
export type Language = 'French' | 'German';
export type ThemeMode = 'dark' | 'light' | 'system';
export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  password: string;
  grade: Grade;
  language: Language;
  createdAt: string;
  onboarded: boolean;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalSessions: number;
  createdAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  duration: number; // minutes
  priority: Priority;
  deadline: string | null;
  notes: string;
  allowSplitting: boolean;
  completed: boolean;
  completedAt: string | null;
  scheduledDate: string | null;
  focusTimeSpent: number; // minutes actually focused
  createdAt: string;
}

export interface SharedTask {
  id: string;
  title: string;
  duration: number; // minutes
  priority: Priority;
  deadline: string | null;
  notes: string;
  completed: boolean;
  completedAt: string | null;
  scheduledDate: string | null;
  focusTimeSpent: number;
  createdAt: string;
}

export interface PlannerItem {
  id: string;
  type: 'session' | 'task';
  refId: string;
  title: string;
  subjectName?: string;
  duration: number;
  priority: Priority;
  date: string; // YYYY-MM-DD
  splitIndex?: number;
  splitTotal?: number;
  isSplit: boolean;
  originalDuration?: number;
}

export interface PlanDay {
  date: string;
  items: PlannerItem[];
  totalMinutes: number;
  completedMinutes: number;
}

export interface WeeklyPlan {
  id: string;
  startDate: string;
  days: PlanDay[];
  createdAt: string;
}

export interface PomodoroSettings {
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakAfter: number; // sessions before long break
  totalCycles: number;
}

export interface FocusHistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  subjectName: string;
  sessionTitle: string;
  duration: number; // minutes focused
  completedAt: string;
}

export interface Goals {
  dailyFocusMinutes: number;
  weeklyFocusMinutes: number;
  sessionCompletionGoal: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number; // 0-100
  threshold: number;
  currentValue: number;
}

export type NotificationType = 'session' | 'deadline' | 'goal' | 'streak' | 'achievement';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserStats {
  totalFocusMinutes: number;
  totalSessionsCompleted: number;
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
  lastStudyDate: string | null;
  focusByDay: Record<string, number>; // date -> minutes
  focusBySubject: Record<string, number>; // subject -> minutes
  sessionsByDay: Record<string, number>; // date -> count
}

export interface UserData {
  subjects: Subject[];
  sessions: StudySession[];
  sharedTasks: SharedTask[];
  weeklyPlans: WeeklyPlan[];
  pomodoroSettings: PomodoroSettings;
  focusHistory: FocusHistoryEntry[];
  goals: Goals;
  achievements: Achievement[];
  notifications: AppNotification[];
  stats: UserStats;
}

export interface LevelInfo {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'STEM Starter', minXp: 0, maxXp: 200 },
  { level: 2, name: 'Curious Mind', minXp: 200, maxXp: 500 },
  { level: 3, name: 'Problem Solver', minXp: 500, maxXp: 1000 },
  { level: 4, name: 'STEM Explorer', minXp: 1000, maxXp: 1800 },
  { level: 5, name: 'Deep Thinker', minXp: 1800, maxXp: 3000 },
  { level: 6, name: 'Innovator', minXp: 3000, maxXp: 5000 },
  { level: 7, name: 'STEM Achiever', minXp: 5000, maxXp: 8000 },
  { level: 8, name: 'STEM Master', minXp: 8000, maxXp: 12000 },
  { level: 9, name: 'Visionary', minXp: 12000, maxXp: 18000 },
  { level: 10, name: 'STEM Legend', minXp: 18000, maxXp: 999999 },
];

export const DEFAULT_SUBJECTS = [
  { name: 'Mathematics', icon: 'Calculator', color: '#3b82f6' },
  { name: 'Mechanics', icon: 'Cog', color: '#f59e0b' },
  { name: 'Physics', icon: 'Atom', color: '#8b5cf6' },
  { name: 'Chemistry', icon: 'FlaskConical', color: '#10b981' },
  { name: 'Biology', icon: 'Dna', color: '#ef4444' },
  { name: 'Geology', icon: 'Mountain', color: '#78716c' },
  { name: 'Computer Science', icon: 'Laptop', color: '#06b6d4' },
  { name: 'Arabic', icon: 'BookOpen', color: '#ec4899' },
  { name: 'English', icon: 'Globe', color: '#6366f1' },
  { name: 'Religion', icon: 'Church', color: '#a855f7' },
  { name: 'French', icon: 'Languages', color: '#64748b' },
  { name: 'German', icon: 'Languages', color: '#f97316' },
];

export const GRADE_SPECIFIC_SUBJECTS: Record<string, { name: string; icon: string; color: string }[]> = {
  'Grade 10': [
    { name: 'Social Studies', icon: 'Landmark', color: '#0d9488' },
  ],
  'Grade 11': [
    { name: 'Citizenship', icon: 'Users', color: '#14b8a6' },
  ],
};

export function getSubjectsForGrade(grade: string) {
  return [...DEFAULT_SUBJECTS, ...(GRADE_SPECIFIC_SUBJECTS[grade] || [])];
}

export const POMODORO_PRESETS = [
  { name: 'Classic', focus: 25, break: 5, longBreak: 15, after: 4 },
  { name: 'Deep Work', focus: 45, break: 10, longBreak: 30, after: 3 },
  { name: 'Intense', focus: 50, break: 10, longBreak: 30, after: 3 },
  { name: 'Flow State', focus: 90, break: 20, longBreak: 45, after: 2 },
];

export const ACHIEVEMENT_DEFS = [
  { id: 'first_step', name: 'First Step', description: 'Complete your first session.', icon: 'Footprints', threshold: 1 },
  { id: 'focused', name: 'Focused', description: 'Study for 5 hours total.', icon: 'Brain', threshold: 300 },
  { id: 'consistent', name: 'Consistent', description: 'Maintain a 7-day streak.', icon: 'Flame', threshold: 7 },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Maintain a 30-day streak.', icon: 'Zap', threshold: 30 },
  { id: 'stem_machine', name: 'STEM Machine', description: 'Complete 100 sessions.', icon: 'Cpu', threshold: 100 },
  { id: 'scholar', name: 'Scholar', description: 'Study for 50 hours total.', icon: 'GraduationCap', threshold: 3000 },
  { id: 'task_master', name: 'Task Master', description: 'Complete 50 shared tasks.', icon: 'CheckSquare', threshold: 50 },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete 10 morning sessions.', icon: 'Sunrise', threshold: 10 },
];
