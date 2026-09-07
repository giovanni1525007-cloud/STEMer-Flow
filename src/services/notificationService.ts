import type { AppNotification, NotificationType } from '@/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export const notificationService = {
  create(type: NotificationType, title: string, message: string): AppNotification {
    return {
      id: generateId(),
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
  },

  generateForSession(session: { title: string; subjectName: string; deadline: string | null }): AppNotification {
    return this.create(
      'session',
      'Upcoming Session',
      `Your ${session.subjectName} — ${session.title} is planned for today.`,
    );
  },

  generateForDeadline(title: string, daysLeft: number): AppNotification {
    return this.create(
      'deadline',
      'Deadline Approaching',
      `${title} is due ${daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}.`,
    );
  },

  generateForGoal(remaining: number): AppNotification {
    return this.create(
      'goal',
      'Goal Progress',
      `You're only ${remaining} minutes away from today's goal!`,
    );
  },

  generateForStreak(days: number): AppNotification {
    return this.create(
      'streak',
      'Streak Reminder',
      `You're on a ${days}-day streak. Keep it going!`,
    );
  },

  generateForAchievement(name: string): AppNotification {
    return this.create(
      'achievement',
      'Achievement Unlocked',
      `Congratulations! You unlocked "${name}".`,
    );
  },
};
