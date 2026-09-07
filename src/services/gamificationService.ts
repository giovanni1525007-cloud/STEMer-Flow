import type { UserStats, Achievement } from '@/types';
import { LEVELS, ACHIEVEMENT_DEFS } from '@/types';

export const gamificationService = {
  getLevelInfo(xp: number) {
    for (const level of LEVELS) {
      if (xp >= level.minXp && xp < level.maxXp) {
        return level;
      }
    }
    return LEVELS[LEVELS.length - 1];
  },

  getLevelProgress(xp: number): { current: number; needed: number; percent: number } {
    const info = this.getLevelInfo(xp);
    const current = xp - info.minXp;
    const needed = info.maxXp - info.minXp;
    const percent = Math.min(100, Math.round((current / needed) * 100));
    return { current, needed, percent };
  },

  awardXP(currentXp: number, amount: number): { newXp: number; leveledUp: boolean; newLevel: number } {
    const oldLevel = this.getLevelInfo(currentXp).level;
    const newXp = currentXp + amount;
    const newLevel = this.getLevelInfo(newXp).level;
    return { newXp, leveledUp: newLevel > oldLevel, newLevel };
  },

  XP_REWARDS: {
    completeSession: 20,
    completeTask: 10,
    dailyGoal: 50,
    weeklyGoal: 100,
    focus30Min: 15,
  },

  checkAchievements(stats: UserStats): { achievement: Achievement; newlyUnlocked: boolean }[] {
    const results: { achievement: Achievement; newlyUnlocked: boolean }[] = [];

    ACHIEVEMENT_DEFS.forEach((def) => {
      let currentValue = 0;
      switch (def.id) {
        case 'first_step':
          currentValue = stats.totalSessionsCompleted;
          break;
        case 'focused':
          currentValue = stats.totalFocusMinutes;
          break;
        case 'consistent':
          currentValue = stats.currentStreak;
          break;
        case 'unstoppable':
          currentValue = stats.longestStreak;
          break;
        case 'stem_machine':
          currentValue = stats.totalSessionsCompleted;
          break;
        case 'scholar':
          currentValue = stats.totalFocusMinutes;
          break;
        case 'task_master':
          currentValue = stats.totalTasksCompleted;
          break;
        case 'early_bird':
          currentValue = stats.totalSessionsCompleted;
          break;
      }

      const progress = Math.min(100, Math.round((currentValue / def.threshold) * 100));
      const unlocked = currentValue >= def.threshold;

      results.push({
        achievement: {
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          unlocked,
          unlockedAt: null,
          progress,
          threshold: def.threshold,
          currentValue,
        },
        newlyUnlocked: unlocked,
      });
    });

    return results;
  },

  updateStreak(stats: UserStats): UserStats {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (stats.lastStudyDate === today) {
      return stats; // already counted today
    }

    let newStreak = stats.currentStreak;
    if (stats.lastStudyDate === yesterdayStr) {
      newStreak = stats.currentStreak + 1;
    } else if (stats.lastStudyDate !== today) {
      newStreak = 1;
    }

    return {
      ...stats,
      currentStreak: newStreak,
      longestStreak: Math.max(stats.longestStreak, newStreak),
      lastStudyDate: today,
    };
  },
};
