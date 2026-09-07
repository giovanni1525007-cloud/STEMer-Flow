import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle2, ListTodo, Flame, Zap, Plus, Brain, Timer,
  Calendar, ArrowRight, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing, ProgressBar } from '@/components/ui/Progress';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { AddSessionModal } from '@/components/sessions/AddSessionModal';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { pomodoroService } from '@/services/pomodoroService';
import { analyticsService } from '@/services/analyticsService';
import type { StudySession, SharedTask } from '@/types';

export function Dashboard() {
  const { user } = useAuth();
  const { data, completeSession, completeSharedTask } = useAppData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayFocus = data.stats.focusByDay[today] || 0;
  const dailyGoal = data.goals.dailyFocusMinutes;
  const todayProgress = Math.min(100, Math.round((todayFocus / dailyGoal) * 100));

  const completedSessionsToday = data.sessions.filter(
    (s) => s.completed && s.completedAt?.startsWith(today)
  ).length;

  const pendingTasks = data.sharedTasks.filter((t) => !t.completed).length + data.sessions.filter((s) => !s.completed).length;

  const todaySessions = data.sessions.filter((s) => !s.completed).slice(0, 4);
  const upcomingTasks = data.sharedTasks.filter((t) => !t.completed).slice(0, 3);

  const nearestDeadlines = useMemo(() => {
    const allItems = [
      ...data.sessions.filter((s) => !s.completed && s.deadline).map((s) => ({ title: s.title, deadline: s.deadline!, subjectName: s.subjectName, type: 'session' as const })),
      ...data.sharedTasks.filter((t) => !t.completed && t.deadline).map((t) => ({ title: t.title, deadline: t.deadline!, subjectName: 'Shared Task', type: 'task' as const })),
    ];
    return allItems.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 4);
  }, [data.sessions, data.sharedTasks]);

  const stats = [
    { label: "Today's Focus Time", value: todayFocus, format: (v: number) => pomodoroService.formatDuration(v), icon: Clock, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { label: 'Completed Sessions', value: completedSessionsToday, suffix: '', icon: CheckCircle2, color: 'text-accent-success', bg: 'bg-accent-success/10' },
    { label: 'Pending Tasks', value: pendingTasks, suffix: '', icon: ListTodo, color: 'text-accent-warning', bg: 'bg-accent-warning/10' },
    { label: 'Current Streak', value: data.stats.currentStreak, suffix: ' Days', icon: Flame, color: 'text-accent-warning', bg: 'bg-accent-warning/10' },
    { label: 'XP', value: data.stats.xp, suffix: '', icon: Zap, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
  ];

  const handleCompleteSession = (session: StudySession) => {
    const { xpGained, leveledUp, newAchievements } = completeSession(session.id, session.duration);
    showToast(`Session completed!`, 'success', xpGained);
    if (leveledUp) showToast('Level Up! You reached a new level!', 'xp');
    newAchievements.forEach((name) => showToast(`Achievement: ${name}`, 'success'));
  };

  const handleCompleteTask = (task: SharedTask) => {
    const { xpGained, leveledUp } = completeSharedTask(task.id);
    showToast('Task completed!', 'success', xpGained);
    if (leveledUp) showToast('Level Up!', 'xp');
  };

  const quickActions = [
    { label: 'Add Session', icon: Plus, color: 'from-brand-blue to-brand-cyan', onClick: () => setAddSessionOpen(true) },
    { label: 'Add Task', icon: Plus, color: 'from-brand-purple to-brand-blue', onClick: () => setAddTaskOpen(true) },
    { label: 'Generate Plan', icon: Brain, color: 'from-accent-success to-brand-cyan', onClick: () => navigate('/app/planner') },
    { label: 'Start Focus', icon: Timer, color: 'from-accent-warning to-accent-error', onClick: () => navigate('/app/focus') },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
          {greeting}, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-text-muted mt-1">Here's your study overview for today.</p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={action.onClick}
            className="group relative overflow-hidden rounded-2xl p-4 bg-surface border border-border hover:border-brand-blue/30 transition-all text-left"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-lg`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-text-primary">{action.label}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Progress */}
        <Card className="lg:col-span-1 p-6 flex flex-col items-center justify-center" delay={0.1}>
          <h3 className="text-sm font-medium text-text-muted mb-4">Today's Progress</h3>
          <ProgressRing value={todayFocus} max={dailyGoal} size={160} strokeWidth={12}>
            <div className="text-center">
              <AnimatedCounter value={todayProgress} className="text-3xl font-bold text-text-primary" />
              <span className="text-lg text-text-primary">%</span>
              <p className="text-xs text-text-muted mt-1">Today's Progress</p>
            </div>
          </ProgressRing>
          <p className="text-sm text-text-secondary mt-4">
            <span className="font-semibold text-text-primary">{pomodoroService.formatDuration(todayFocus)}</span>
            {' / '}
            {pomodoroService.formatDuration(dailyGoal)} Goal
          </p>
          <Button
            className="mt-4 w-full"
            onClick={() => navigate('/app/focus')}
          >
            <Timer className="w-4 h-4" />
            Start Focusing
          </Button>
        </Card>

        {/* Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <Card key={stat.label} hover delay={0.15 + i * 0.05} className="p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-text-primary">
                <AnimatedCounter value={stat.value} format={stat.format} />
                {stat.suffix && <span className="text-sm text-text-muted ml-1">{stat.suffix}</span>}
              </div>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Sessions */}
        <Card className="p-5" delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Today's Sessions</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/sessions')}>
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          {todaySessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-muted">No sessions scheduled for today.</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setAddSessionOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Session
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary hover:bg-surface-hover transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{session.title}</p>
                    <p className="text-xs text-text-muted">{session.subjectName} · {pomodoroService.formatDuration(session.duration)}</p>
                  </div>
                  <Badge variant={session.priority === 'high' ? 'error' : session.priority === 'medium' ? 'warning' : 'default'}>
                    {session.priority}
                  </Badge>
                  <Button size="sm" variant="success" onClick={() => handleCompleteSession(session)}>
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Tasks */}
        <Card className="p-5" delay={0.35}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Upcoming Tasks</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/tasks')}>
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8">
              <ListTodo className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-muted">No pending tasks.</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setAddTaskOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary hover:bg-surface-hover transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
                    <p className="text-xs text-text-muted">
                      {pomodoroService.formatDuration(task.duration)}
                      {task.deadline && ` · Due ${new Date(task.deadline).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Badge variant={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}>
                    {task.priority}
                  </Badge>
                  <Button size="sm" variant="success" onClick={() => handleCompleteTask(task)}>
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Nearest Deadlines */}
      <Card className="p-5" delay={0.4}>
        <h3 className="font-semibold text-text-primary mb-4">Nearest Deadlines</h3>
        {nearestDeadlines.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm text-text-muted">No upcoming deadlines.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearestDeadlines.map((item, i) => {
              const daysLeft = Math.ceil((new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${daysLeft <= 1 ? 'bg-accent-error/10' : 'bg-accent-warning/10'}`}>
                    <AlertCircle className={`w-4 h-4 ${daysLeft <= 1 ? 'text-accent-error' : 'text-accent-warning'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                    <p className="text-xs text-text-muted">{item.subjectName}</p>
                  </div>
                  <Badge variant={daysLeft <= 1 ? 'error' : 'warning'}>
                    {daysLeft <= 0 ? 'Overdue' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Weekly Goal Progress */}
      <Card className="p-5" delay={0.45}>
        <h3 className="font-semibold text-text-primary mb-4">Weekly Goal Progress</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text-secondary">Daily Focus</span>
              <span className="text-sm font-medium text-text-primary">{pomodoroService.formatDuration(todayFocus)} / {pomodoroService.formatDuration(dailyGoal)}</span>
            </div>
            <ProgressBar value={todayFocus} max={dailyGoal} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text-secondary">Weekly Focus</span>
              <span className="text-sm font-medium text-text-primary">{pomodoroService.formatDuration(analyticsService.getWeeklyFocus(data.focusHistory))} / {pomodoroService.formatDuration(data.goals.weeklyFocusMinutes)}</span>
            </div>
            <ProgressBar value={analyticsService.getWeeklyFocus(data.focusHistory)} max={data.goals.weeklyFocusMinutes} color="bg-gradient-to-r from-brand-purple to-brand-blue" />
          </div>
        </div>
      </Card>

      <AddSessionModal open={addSessionOpen} onClose={() => setAddSessionOpen(false)} />
      <AddTaskModal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} />
    </div>
  );
}
