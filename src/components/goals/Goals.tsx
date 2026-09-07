import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, CheckCircle2, Edit, Trophy } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing, ProgressBar } from '@/components/ui/Progress';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { pomodoroService } from '@/services/pomodoroService';
import { analyticsService } from '@/services/analyticsService';

export function Goals() {
  const { data, updateGoals } = useAppData();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [daily, setDaily] = useState(data.goals.dailyFocusMinutes);
  const [weekly, setWeekly] = useState(data.goals.weeklyFocusMinutes);
  const [sessionGoal, setSessionGoal] = useState(data.goals.sessionCompletionGoal);

  const today = new Date().toISOString().split('T')[0];
  const todayFocus = data.stats.focusByDay[today] || 0;
  const weeklyFocus = analyticsService.getWeeklyFocus(data.focusHistory);
  const completedSessions = data.stats.totalSessionsCompleted;

  const dailyPercent = Math.min(100, (todayFocus / data.goals.dailyFocusMinutes) * 100);
  const weeklyPercent = Math.min(100, (weeklyFocus / data.goals.weeklyFocusMinutes) * 100);
  const sessionPercent = Math.min(100, (completedSessions / data.goals.sessionCompletionGoal) * 100);

  const goals = [
    {
      label: 'Daily Focus Goal',
      current: todayFocus,
      target: data.goals.dailyFocusMinutes,
      percent: dailyPercent,
      format: (v: number) => pomodoroService.formatDuration(v),
      icon: Clock,
      color: 'from-brand-blue to-brand-cyan',
      ringColor: 'text-brand-blue',
    },
    {
      label: 'Weekly Focus Goal',
      current: weeklyFocus,
      target: data.goals.weeklyFocusMinutes,
      percent: weeklyPercent,
      format: (v: number) => pomodoroService.formatDuration(v),
      icon: Target,
      color: 'from-brand-purple to-brand-blue',
      ringColor: 'text-brand-purple',
    },
    {
      label: 'Session Completion Goal',
      current: completedSessions,
      target: data.goals.sessionCompletionGoal,
      percent: sessionPercent,
      format: (v: number) => Math.round(v).toString(),
      icon: CheckCircle2,
      color: 'from-accent-success to-brand-cyan',
      ringColor: 'text-accent-success',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Goals</h1>
          <p className="text-text-muted mt-1">Set and track your study goals.</p>
        </div>
        <Button onClick={() => setEditOpen(true)}>
          <Edit className="w-4 h-4" />
          Edit Goals
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {goals.map((goal, i) => (
          <Card key={goal.label} delay={i * 0.1} className="p-6 flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${goal.color} flex items-center justify-center mb-4 shadow-lg`}>
              <goal.icon className="w-6 h-6 text-white" />
            </div>
            <ProgressRing value={goal.current} max={goal.target} size={130} strokeWidth={10}>
              <div className="text-center">
                <AnimatedCounter value={goal.percent} className="text-2xl font-bold text-text-primary" />
                <span className="text-lg text-text-primary">%</span>
              </div>
            </ProgressRing>
            <h3 className="font-semibold text-text-primary mt-4">{goal.label}</h3>
            <p className="text-sm text-text-muted mt-1">
              <span className="font-medium text-text-primary">{goal.format(goal.current)}</span>
              {' / '}
              {goal.format(goal.target)}
            </p>
            {goal.percent >= 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mt-3"
              >
                <Badge variant="success">
                  <Trophy className="w-3 h-3" />
                  Goal Achieved!
                </Badge>
              </motion.div>
            )}
          </Card>
        ))}
      </div>

      {/* Progress bars */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">Progress Overview</h3>
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-text-secondary">{goal.label}</span>
                <span className="text-sm font-medium text-text-primary">
                  {goal.format(goal.current)} / {goal.format(goal.target)}
                </span>
              </div>
              <ProgressBar
                value={goal.current}
                max={goal.target}
                color={`bg-gradient-to-r ${goal.color}`}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Goals" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Daily Focus Goal (minutes)</label>
            <Input type="number" value={daily} onChange={(e) => setDaily(parseInt(e.target.value) || 120)} />
            <p className="text-xs text-text-muted mt-1">{pomodoroService.formatDuration(daily)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Weekly Focus Goal (minutes)</label>
            <Input type="number" value={weekly} onChange={(e) => setWeekly(parseInt(e.target.value) || 600)} />
            <p className="text-xs text-text-muted mt-1">{pomodoroService.formatDuration(weekly)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Session Completion Goal</label>
            <Input type="number" value={sessionGoal} onChange={(e) => setSessionGoal(parseInt(e.target.value) || 10)} />
          </div>
          <Button className="w-full" onClick={() => {
            updateGoals({ dailyFocusMinutes: daily, weeklyFocusMinutes: weekly, sessionCompletionGoal: sessionGoal });
            showToast('Goals updated', 'success');
            setEditOpen(false);
          }}>
            Save Goals
          </Button>
        </div>
      </Modal>
    </div>
  );
}
