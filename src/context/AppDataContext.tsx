import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  UserData, StudySession, SharedTask, Subject, WeeklyPlan,
  PomodoroSettings, Goals, AppNotification, UserStats, FocusHistoryEntry,
  Priority, Achievement,
} from '@/types';
import { ACHIEVEMENT_DEFS } from '@/types';
import { gamificationService } from '@/services/gamificationService';
import { notificationService } from '@/services/notificationService';
import { plannerService } from '@/services/plannerService';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from './AuthContext';

function getDefaultUserData(): UserData {
  return {
    subjects: [],
    sessions: [],
    sharedTasks: [],
    weeklyPlans: [],
    pomodoroSettings: {
      focusDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      longBreakAfter: 4,
      totalCycles: 4,
    },
    focusHistory: [],
    goals: {
      dailyFocusMinutes: 120,
      weeklyFocusMinutes: 600,
      sessionCompletionGoal: 10,
    },
    achievements: ACHIEVEMENT_DEFS.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      unlocked: false,
      unlockedAt: null,
      progress: 0,
      threshold: a.threshold,
      currentValue: 0,
    })),
    notifications: [],
    stats: {
      totalFocusMinutes: 0,
      totalSessionsCompleted: 0,
      totalTasksCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      xp: 0,
      level: 1,
      lastStudyDate: null,
      focusByDay: {},
      focusBySubject: {},
      sessionsByDay: {},
    },
  };
}

interface AppDataContextType {
  data: UserData;
  loading: boolean;
  addSession: (session: Omit<StudySession, 'id' | 'completed' | 'completedAt' | 'focusTimeSpent' | 'createdAt'>) => void;
  updateSession: (id: string, updates: Partial<StudySession>) => void;
  deleteSession: (id: string) => void;
  completeSession: (id: string, focusMinutes?: number) => { xpGained: number; leveledUp: boolean; newAchievements: string[] };
  addSharedTask: (task: Omit<SharedTask, 'id' | 'completed' | 'completedAt' | 'focusTimeSpent' | 'createdAt'>) => void;
  updateSharedTask: (id: string, updates: Partial<SharedTask>) => void;
  deleteSharedTask: (id: string) => void;
  completeSharedTask: (id: string) => { xpGained: number; leveledUp: boolean; newAchievements: string[] };
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
  removeSubject: (id: string) => void;
  generatePlan: (startDate: Date, numDays: number) => void;
  movePlanItem: (planId: string, itemId: string, targetDate: string) => void;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  updateGoals: (goals: Partial<Goals>) => void;
  addFocusHistory: (entry: FocusHistoryEntry) => { xpGained: number; leveledUp: boolean };
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: AppNotification) => void;
  resetData: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<UserData>(getDefaultUserData());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData(getDefaultUserData());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const loaded = await loadUserData(user.id);
      if (!cancelled) {
        setData(loaded);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const checkAndAwardAchievements = useCallback((stats: UserStats): { newAchievements: string[]; updatedAchievements: Achievement[] } => {
    const checked = gamificationService.checkAchievements(stats);
    const newAchievements: string[] = [];
    const updatedAchievements = checked.map((c) => {
      const existing = data.achievements.find((a) => a.id === c.achievement.id);
      const wasUnlocked = existing?.unlocked || false;
      if (c.achievement.unlocked && !wasUnlocked) {
        newAchievements.push(c.achievement.name);
      }
      return {
        ...c.achievement,
        unlockedAt: c.achievement.unlocked ? (existing?.unlockedAt || new Date().toISOString()) : null,
      };
    });

    return { newAchievements, updatedAchievements };
  }, [data.achievements]);

  const addSession: AppDataContextType['addSession'] = (session) => {
    const newSession: StudySession = {
      ...session,
      id: crypto.randomUUID(),
      completed: false,
      completedAt: null,
      focusTimeSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, sessions: [...prev.sessions, newSession] }));
    supabase.from('study_sessions').insert({
      subject_id: newSession.subjectId,
      subject_name: newSession.subjectName,
      title: newSession.title,
      duration_minutes: newSession.duration,
      priority: newSession.priority,
      deadline: newSession.deadline,
      notes: newSession.notes,
      allow_splitting: newSession.allowSplitting,
      completed: false,
      completed_at: null,
      scheduled_date: newSession.scheduledDate,
      actual_minutes: 0,
    }).then();
  };

  const updateSession: AppDataContextType['updateSession'] = (id, updates) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    const dbUpdates: Record<string, any> = {};
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    if (updates.focusTimeSpent !== undefined) dbUpdates.actual_minutes = updates.focusTimeSpent;
    if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.allowSplitting !== undefined) dbUpdates.allow_splitting = updates.allowSplitting;
    dbUpdates.updated_at = new Date().toISOString();
    if (Object.keys(dbUpdates).length > 1) {
      supabase.from('study_sessions').update(dbUpdates).eq('id', id).then();
    }
  };

  const deleteSession: AppDataContextType['deleteSession'] = (id) => {
    setData((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.id !== id) }));
    supabase.from('study_sessions').delete().eq('id', id).then();
  };

  const completeSession: AppDataContextType['completeSession'] = (id, focusMinutes = 0) => {
    let xpGained = gamificationService.XP_REWARDS.completeSession;
    let leveledUp = false;
    let newAchievements: string[] = [];

    setData((prev) => {
      const session = prev.sessions.find((s) => s.id === id);
      if (!session || session.completed) return prev;

      const updatedSessions = prev.sessions.map((s) =>
        s.id === id
          ? { ...s, completed: true, completedAt: new Date().toISOString(), focusTimeSpent: s.focusTimeSpent + focusMinutes }
          : s
      );

      const focusEntry: FocusHistoryEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        subjectName: session.subjectName,
        sessionTitle: session.title,
        duration: focusMinutes || session.duration,
        completedAt: new Date().toISOString(),
      };

      let newStats: UserStats = {
        ...prev.stats,
        totalSessionsCompleted: prev.stats.totalSessionsCompleted + 1,
        totalFocusMinutes: prev.stats.totalFocusMinutes + (focusMinutes || session.duration),
        xp: prev.stats.xp + xpGained,
      };

      if (focusMinutes >= 30) {
        xpGained += gamificationService.XP_REWARDS.focus30Min;
        newStats.xp += gamificationService.XP_REWARDS.focus30Min;
      }

      newStats = gamificationService.updateStreak(newStats);

      const today = new Date().toISOString().split('T')[0];
      newStats.focusByDay = { ...newStats.focusByDay, [today]: (newStats.focusByDay[today] || 0) + (focusMinutes || session.duration) };
      newStats.focusBySubject = { ...newStats.focusBySubject, [session.subjectName]: (newStats.focusBySubject[session.subjectName] || 0) + (focusMinutes || session.duration) };
      newStats.sessionsByDay = { ...newStats.sessionsByDay, [today]: (newStats.sessionsByDay[today] || 0) + 1 };

      const levelResult = gamificationService.awardXP(prev.stats.xp, xpGained);
      leveledUp = levelResult.leveledUp;
      newStats.level = levelResult.newLevel;

      const todayFocus = newStats.focusByDay[today] || 0;
      const prevTodayFocus = prev.stats.focusByDay[today] || 0;
      if (todayFocus >= prev.goals.dailyFocusMinutes && prevTodayFocus < prev.goals.dailyFocusMinutes) {
        newStats.xp += gamificationService.XP_REWARDS.dailyGoal;
        xpGained += gamificationService.XP_REWARDS.dailyGoal;
      }

      const achResult = checkAndAwardAchievements(newStats);
      newAchievements = achResult.newAchievements;

      const newNotifications = [...prev.notifications];
      achResult.newAchievements.forEach((name) => {
        const notif = notificationService.generateForAchievement(name);
        newNotifications.unshift(notif);
        supabase.from('notifications').insert({
          type: notif.type,
          title: notif.title,
          message: notif.message,
          read: false,
        }).then();
      });

      supabase.from('study_sessions').update({
        completed: true,
        completed_at: new Date().toISOString(),
        actual_minutes: session.focusTimeSpent + focusMinutes,
        updated_at: new Date().toISOString(),
      }).eq('id', id).then();

      supabase.from('focus_sessions').insert({
        study_session_id: id,
        mode: 'focus',
        planned_minutes: session.duration,
        actual_minutes: focusMinutes || session.duration,
        subject_name: session.subjectName,
        session_title: session.title,
        started_at: focusEntry.completedAt,
        completed_at: focusEntry.completedAt,
        completed: true,
        date: focusEntry.date,
      }).then();

      recordXp(xpGained, 'session_completed', id);

      syncStats(newStats, achResult.updatedAchievements);

      return {
        ...prev,
        sessions: updatedSessions,
        focusHistory: [...prev.focusHistory, focusEntry],
        stats: newStats,
        achievements: achResult.updatedAchievements,
        notifications: newNotifications,
      };
    });

    return { xpGained, leveledUp, newAchievements };
  };

  const addSharedTask: AppDataContextType['addSharedTask'] = (task) => {
    const newTask: SharedTask = {
      ...task,
      id: crypto.randomUUID(),
      completed: false,
      completedAt: null,
      focusTimeSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, sharedTasks: [...prev.sharedTasks, newTask] }));
    supabase.from('shared_tasks').insert({
      title: newTask.title,
      duration_minutes: newTask.duration,
      priority: newTask.priority,
      deadline: newTask.deadline,
      notes: newTask.notes,
      completed: false,
      completed_at: null,
      scheduled_date: newTask.scheduledDate,
      actual_minutes: 0,
    }).then();
  };

  const updateSharedTask: AppDataContextType['updateSharedTask'] = (id, updates) => {
    setData((prev) => ({
      ...prev,
      sharedTasks: prev.sharedTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    const dbUpdates: Record<string, any> = {};
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    dbUpdates.updated_at = new Date().toISOString();
    if (Object.keys(dbUpdates).length > 1) {
      supabase.from('shared_tasks').update(dbUpdates).eq('id', id).then();
    }
  };

  const deleteSharedTask: AppDataContextType['deleteSharedTask'] = (id) => {
    setData((prev) => ({ ...prev, sharedTasks: prev.sharedTasks.filter((t) => t.id !== id) }));
    supabase.from('shared_tasks').delete().eq('id', id).then();
  };

  const completeSharedTask: AppDataContextType['completeSharedTask'] = (id) => {
    let xpGained = gamificationService.XP_REWARDS.completeTask;
    let leveledUp = false;
    let newAchievements: string[] = [];

    setData((prev) => {
      const task = prev.sharedTasks.find((t) => t.id === id);
      if (!task || task.completed) return prev;

      const updatedTasks = prev.sharedTasks.map((t) =>
        t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      );

      let newStats: UserStats = {
        ...prev.stats,
        totalTasksCompleted: prev.stats.totalTasksCompleted + 1,
        xp: prev.stats.xp + xpGained,
      };

      const levelResult = gamificationService.awardXP(prev.stats.xp, xpGained);
      leveledUp = levelResult.leveledUp;
      newStats.level = levelResult.newLevel;

      const achResult = checkAndAwardAchievements(newStats);
      newAchievements = achResult.newAchievements;

      const newNotifications = [...prev.notifications];
      achResult.newAchievements.forEach((name) => {
        const notif = notificationService.generateForAchievement(name);
        newNotifications.unshift(notif);
        supabase.from('notifications').insert({
          type: notif.type,
          title: notif.title,
          message: notif.message,
          read: false,
        }).then();
      });

      supabase.from('shared_tasks').update({
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id).then();

      recordXp(xpGained, 'task_completed', id);

      syncStats(newStats, achResult.updatedAchievements);

      return {
        ...prev,
        sharedTasks: updatedTasks,
        stats: newStats,
        achievements: achResult.updatedAchievements,
        notifications: newNotifications,
      };
    });

    return { xpGained, leveledUp, newAchievements };
  };

  const addSubject: AppDataContextType['addSubject'] = (subject) => {
    const newSubject: Subject = {
      ...subject,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
    supabase.from('subjects').insert({
      name: newSubject.name,
      icon: newSubject.icon,
      color: newSubject.color,
      total_sessions: newSubject.totalSessions,
    }).then();
  };

  const removeSubject: AppDataContextType['removeSubject'] = (id) => {
    setData((prev) => ({ ...prev, subjects: prev.subjects.filter((s) => s.id !== id) }));
    supabase.from('subjects').delete().eq('id', id).then();
  };

  const generatePlan: AppDataContextType['generatePlan'] = (startDate, numDays) => {
    const days = plannerService.generatePlan(data.sessions, data.sharedTasks, startDate, numDays);
    const plan: WeeklyPlan = {
      id: crypto.randomUUID(),
      startDate: startDate.toISOString().split('T')[0],
      days,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, weeklyPlans: [plan, ...prev.weeklyPlans.slice(0, 4)] }));

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + numDays - 1);

    supabase.from('weekly_plans').insert({
      start_date: plan.startDate,
      end_date: endDate.toISOString().split('T')[0],
      days: JSON.parse(JSON.stringify(days)),
    }).select().then(({ data: inserted }: { data: any[] | null }) => {
      if (!inserted || inserted.length === 0) return;
      const planId = inserted[0].id;

      const items: any[] = [];
      days.forEach((day) => {
        day.items.forEach((item, i) => {
          items.push({
            plan_id: planId,
            date: day.date,
            session_id: item.type === 'session' ? item.refId : null,
            task_id: item.type === 'task' ? item.refId : null,
            planned_minutes: item.duration,
            position: i,
            completed: false,
          });
        });
      });

      if (items.length > 0) {
        supabase.from('plan_items').insert(items).then();
      }
    });
  };

  const movePlanItem: AppDataContextType['movePlanItem'] = (planId, itemId, targetDate) => {
    setData((prev) => ({
      ...prev,
      weeklyPlans: prev.weeklyPlans.map((plan) => {
        if (plan.id !== planId) return plan;
        return { ...plan, days: plannerService.moveItem(plan.days, itemId, targetDate) };
      }),
    }));
    setData((prev) => {
      const plan = prev.weeklyPlans.find((p) => p.id === planId);
      if (plan) {
        supabase.from('weekly_plans').update({
          days: JSON.parse(JSON.stringify(plan.days)),
        }).eq('id', planId).then();
      }
      return prev;
    });
  };

  const updatePomodoroSettings: AppDataContextType['updatePomodoroSettings'] = (settings) => {
    setData((prev) => ({ ...prev, pomodoroSettings: { ...prev.pomodoroSettings, ...settings } }));
    setData((prev) => {
      supabase.from('pomodoro_settings').upsert({
        user_id: user?.id,
        focus_minutes: prev.pomodoroSettings.focusDuration,
        short_break_minutes: prev.pomodoroSettings.breakDuration,
        long_break_minutes: prev.pomodoroSettings.longBreakDuration,
        cycles_before_long_break: prev.pomodoroSettings.longBreakAfter,
        updated_at: new Date().toISOString(),
      }).then();
      return prev;
    });
  };

  const updateGoals: AppDataContextType['updateGoals'] = (goals) => {
    setData((prev) => ({ ...prev, goals: { ...prev.goals, ...goals } }));
    setData((prev) => {
      supabase.from('user_settings').upsert({
        user_id: user?.id,
        goals: prev.goals,
        updated_at: new Date().toISOString(),
      }).then();
      return prev;
    });
  };

  const addFocusHistory: AppDataContextType['addFocusHistory'] = (entry) => {
    let xpGained = 0;
    let leveledUp = false;

    setData((prev) => {
      const today = entry.date;
      let newStats: UserStats = {
        ...prev.stats,
        totalFocusMinutes: prev.stats.totalFocusMinutes + entry.duration,
        xp: prev.stats.xp,
      };

      const focusXp = Math.floor(entry.duration / 30) * gamificationService.XP_REWARDS.focus30Min;
      xpGained = focusXp;
      newStats.xp += focusXp;

      newStats = gamificationService.updateStreak(newStats);
      newStats.focusByDay = { ...newStats.focusByDay, [today]: (newStats.focusByDay[today] || 0) + entry.duration };
      newStats.focusBySubject = { ...newStats.focusBySubject, [entry.subjectName]: (newStats.focusBySubject[entry.subjectName] || 0) + entry.duration };

      const levelResult = gamificationService.awardXP(prev.stats.xp, focusXp);
      leveledUp = levelResult.leveledUp;
      newStats.level = levelResult.newLevel;

      supabase.from('focus_sessions').insert({
        mode: 'focus',
        planned_minutes: entry.duration,
        actual_minutes: entry.duration,
        subject_name: entry.subjectName,
        session_title: entry.sessionTitle,
        started_at: entry.completedAt,
        completed_at: entry.completedAt,
        completed: true,
        date: entry.date,
      }).then();

      recordXp(focusXp, 'focus_completed');

      syncStats(newStats, prev.achievements);

      return { ...prev, focusHistory: [...prev.focusHistory, entry], stats: newStats };
    });

    return { xpGained, leveledUp };
  };

  const markNotificationRead: AppDataContextType['markNotificationRead'] = (id) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    supabase.from('notifications').update({ read: true }).eq('id', id).then();
  };

  const markAllNotificationsRead: AppDataContextType['markAllNotificationsRead'] = () => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
    supabase.from('notifications').update({ read: true }).eq('read', false).then();
  };

  const clearNotifications: AppDataContextType['clearNotifications'] = () => {
    setData((prev) => ({ ...prev, notifications: [] }));
    supabase.from('notifications').delete().then();
  };

  const addNotification: AppDataContextType['addNotification'] = (notification) => {
    setData((prev) => ({ ...prev, notifications: [notification, ...prev.notifications] }));
    supabase.from('notifications').insert({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
    }).then();
  };

  const resetData: AppDataContextType['resetData'] = () => {
    const fresh = getDefaultUserData();
    setData(fresh);
    if (!user) return;

    const userId = user.id;
    supabase.from('plan_items').delete().then();
    supabase.from('weekly_plans').delete().then();
    supabase.from('focus_sessions').delete().then();
    supabase.from('xp_transactions').delete().then();
    supabase.from('user_achievements').delete().then();
    supabase.from('study_sessions').delete().then();
    supabase.from('shared_tasks').delete().then();
    supabase.from('user_subjects').delete().then();
    supabase.from('subjects').delete().then();
    supabase.from('notifications').delete().then();
    supabase.from('goals').delete().then();
    supabase.from('user_stats').delete().eq('user_id', userId).then();
  };

  function recordXp(amount: number, reason: string, referenceId?: string) {
    if (!user || amount === 0) return;
    supabase.from('xp_transactions').insert({
      amount,
      reason,
      reference_id: referenceId || null,
    }).then();
  }

  function syncStats(stats: UserStats, achievements: Achievement[]) {
    if (!user) return;
    supabase.from('user_stats').upsert({
      user_id: user.id,
      total_focus_minutes: stats.totalFocusMinutes,
      total_sessions_completed: stats.totalSessionsCompleted,
      total_tasks_completed: stats.totalTasksCompleted,
      current_streak: stats.currentStreak,
      longest_streak: stats.longestStreak,
      xp: stats.xp,
      level: stats.level,
      last_study_date: stats.lastStudyDate,
      focus_by_day: stats.focusByDay,
      focus_by_subject: stats.focusBySubject,
      sessions_by_day: stats.sessionsByDay,
    }).then();

    achievements.forEach((a) => {
      if (a.unlocked) {
        const defId = getAchievementDefIdSync(a.id);
        if (defId) {
          supabase.from('user_achievements').upsert({
            user_id: user.id,
            achievement_id: defId,
            unlocked_at: a.unlockedAt,
          }).then();
        } else {
          getAchievementDefId(a.id).then((defId) => {
            if (defId) {
              supabase.from('user_achievements').upsert({
                user_id: user.id,
                achievement_id: defId,
                unlocked_at: a.unlockedAt,
              }).then();
            }
          });
        }
      }
    });
  }

  return (
    <AppDataContext.Provider
      value={{
        data,
        loading,
        addSession,
        updateSession,
        deleteSession,
        completeSession,
        addSharedTask,
        updateSharedTask,
        deleteSharedTask,
        completeSharedTask,
        addSubject,
        removeSubject,
        generatePlan,
        movePlanItem,
        updatePomodoroSettings,
        updateGoals,
        addFocusHistory,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        addNotification,
        resetData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

const achievementDefIdMap: Record<string, string> = {};

async function getAchievementDefId(slug: string): Promise<string> {
  if (achievementDefIdMap[slug]) return achievementDefIdMap[slug];
  const { data } = await supabase.from('achievement_defs').select('id').eq('slug', slug).maybeSingle();
  if (data) {
    achievementDefIdMap[slug] = data.id;
    return data.id;
  }
  return '';
}

function getAchievementDefIdSync(slug: string): string {
  return achievementDefIdMap[slug] || '';
}

async function loadUserData(_userId: string): Promise<UserData> {
  const defaults = getDefaultUserData();

  const [
    { data: subjects },
    { data: sessions },
    { data: tasks },
    { data: plans },
    { data: focusSessions },
    { data: pomodoroRow },
    { data: settingsRow },
    { data: statsRow },
    { data: userAchievementRows },
    { data: notificationRows },
  ] = await Promise.all([
    supabase.from('subjects').select('*').order('created_at', { ascending: true }),
    supabase.from('study_sessions').select('*').order('created_at', { ascending: true }),
    supabase.from('shared_tasks').select('*').order('created_at', { ascending: true }),
    supabase.from('weekly_plans').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('focus_sessions').select('*').order('completed_at', { ascending: true }),
    supabase.from('pomodoro_settings').select('*').maybeSingle(),
    supabase.from('user_settings').select('*').maybeSingle(),
    supabase.from('user_stats').select('*').maybeSingle(),
    supabase.from('user_achievements').select('*, achievement_defs(slug)').eq('unlocked', true),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }),
  ]);

  const pomodoroSettings: PomodoroSettings = pomodoroRow
    ? {
        focusDuration: pomodoroRow.focus_minutes,
        breakDuration: pomodoroRow.short_break_minutes,
        longBreakDuration: pomodoroRow.long_break_minutes,
        longBreakAfter: pomodoroRow.cycles_before_long_break,
        totalCycles: pomodoroRow.cycles_before_long_break,
      }
    : defaults.pomodoroSettings;

  const goals: Goals = settingsRow?.goals
    ? { ...defaults.goals, ...settingsRow.goals }
    : defaults.goals;

  const unlockedSlugs = new Set(
    (userAchievementRows || [])
      .map((r: any) => r.achievement_defs?.slug)
      .filter(Boolean)
  );

  const achievements = defaults.achievements.map((a) => ({
    ...a,
    unlocked: unlockedSlugs.has(a.id),
    unlockedAt: unlockedSlugs.has(a.id) ? new Date().toISOString() : null,
  }));

  return {
    subjects: (subjects || []).map(mapSubject),
    sessions: (sessions || []).map(mapSession),
    sharedTasks: (tasks || []).map(mapTask),
    weeklyPlans: (plans || []).map(mapPlan),
    pomodoroSettings,
    focusHistory: (focusSessions || []).map(mapFocusSession),
    goals,
    achievements,
    notifications: (notificationRows || []).map(mapNotification),
    stats: statsRow ? mapStats(statsRow) : defaults.stats,
  };
}

function mapSubject(r: any): Subject {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    totalSessions: r.total_sessions,
    createdAt: r.created_at,
  };
}

function mapSession(r: any): StudySession {
  return {
    id: r.id,
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    title: r.title,
    duration: r.duration_minutes ?? r.duration ?? 0,
    priority: r.priority as Priority,
    deadline: r.deadline,
    notes: r.notes || '',
    allowSplitting: r.allow_splitting,
    completed: r.completed,
    completedAt: r.completed_at,
    scheduledDate: r.scheduled_date,
    focusTimeSpent: r.actual_minutes ?? r.focus_time_spent ?? 0,
    createdAt: r.created_at,
  };
}

function mapTask(r: any): SharedTask {
  return {
    id: r.id,
    title: r.title,
    duration: r.duration_minutes ?? r.duration ?? 0,
    priority: r.priority as Priority,
    deadline: r.deadline,
    notes: r.notes || '',
    completed: r.completed,
    completedAt: r.completed_at,
    scheduledDate: r.scheduled_date,
    focusTimeSpent: r.actual_minutes ?? r.focus_time_spent ?? 0,
    createdAt: r.created_at,
  };
}

function mapPlan(r: any): WeeklyPlan {
  return {
    id: r.id,
    startDate: r.start_date,
    days: r.days || [],
    createdAt: r.created_at,
  };
}

function mapFocusSession(r: any): FocusHistoryEntry {
  return {
    id: r.id,
    date: r.date,
    subjectName: r.subject_name || '',
    sessionTitle: r.session_title || '',
    duration: r.actual_minutes || 0,
    completedAt: r.completed_at || r.started_at,
  };
}

function mapStats(r: any): UserStats {
  return {
    totalFocusMinutes: r.total_focus_minutes,
    totalSessionsCompleted: r.total_sessions_completed,
    totalTasksCompleted: r.total_tasks_completed,
    currentStreak: r.current_streak,
    longestStreak: r.longest_streak,
    xp: r.xp,
    level: r.level,
    lastStudyDate: r.last_study_date,
    focusByDay: r.focus_by_day || {},
    focusBySubject: r.focus_by_subject || {},
    sessionsByDay: r.sessions_by_day || {},
  };
}

function mapNotification(r: any): AppNotification {
  return {
    id: r.id,
    type: r.type as AppNotification['type'],
    title: r.title,
    message: r.message,
    read: r.read,
    createdAt: r.created_at,
  };
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
