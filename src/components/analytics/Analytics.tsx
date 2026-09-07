import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Clock, Target, Flame, Award, TrendingUp, BookOpen } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { Card } from '@/components/ui/Card';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { pomodoroService } from '@/services/pomodoroService';
import { analyticsService } from '@/services/analyticsService';
import { useTheme } from '@/context/ThemeContext';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export function Analytics() {
  const { data } = useAppData();
  const { isDark } = useTheme();

  const focusByDay = useMemo(() => analyticsService.getFocusByDay(data.focusHistory, 7), [data.focusHistory]);
  const focusBySubject = useMemo(() => analyticsService.getFocusBySubject(data.focusHistory), [data.focusHistory]);
  const sessionsByDay = useMemo(() => analyticsService.getSessionsByDay(data.focusHistory, 7), [data.focusHistory]);

  const totalFocus = data.stats.totalFocusMinutes;
  const weeklyFocus = analyticsService.getWeeklyFocus(data.focusHistory);
  const monthlyFocus = analyticsService.getMonthlyFocus(data.focusHistory);
  const completionRate = analyticsService.getCompletionRate(data.sessions);
  const avgDaily = analyticsService.getAverageDaily(data.focusHistory);
  const mostStudied = analyticsService.getMostStudiedSubject(data.focusHistory);

  const weeklyGoalProgress = Math.min(100, Math.round((weeklyFocus / data.goals.weeklyFocusMinutes) * 100));

  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipBg = isDark ? '#161f38' : '#ffffff';
  const tooltipBorder = isDark ? '#2a3556' : '#e2e8f0';

  const stats = [
    { label: 'Total Focus Time', value: totalFocus, format: (v: number) => pomodoroService.formatDuration(v), icon: Clock, color: 'text-brand-blue' },
    { label: 'Weekly Focus', value: weeklyFocus, format: (v: number) => pomodoroService.formatDuration(v), icon: Target, color: 'text-brand-purple' },
    { label: 'Monthly Focus', value: monthlyFocus, format: (v: number) => pomodoroService.formatDuration(v), icon: TrendingUp, color: 'text-brand-cyan' },
    { label: 'Completed Sessions', value: data.stats.totalSessionsCompleted, format: (v: number) => Math.round(v).toString(), icon: BookOpen, color: 'text-accent-success' },
    { label: 'Completion Rate', value: completionRate, format: (v: number) => `${Math.round(v)}%`, icon: Award, color: 'text-accent-warning' },
    { label: 'Current Streak', value: data.stats.currentStreak, format: (v: number) => `${Math.round(v)} days`, icon: Flame, color: 'text-accent-error' },
    { label: 'Longest Streak', value: data.stats.longestStreak, format: (v: number) => `${Math.round(v)} days`, icon: Flame, color: 'text-accent-warning' },
    { label: 'Avg Daily Study', value: avgDaily, format: (v: number) => pomodoroService.formatDuration(v), icon: Clock, color: 'text-brand-blue' },
  ];

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: '12px',
    fontSize: '12px',
    color: isDark ? '#f1f5f9' : '#0f172a',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-muted mt-1">Track your study progress and statistics.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <Card key={stat.label} delay={i * 0.03} className="p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="text-xl font-bold text-text-primary">
              <AnimatedCounter value={stat.value} format={stat.format} />
            </div>
            <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Most studied subject */}
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-purple" />
          <div>
            <p className="text-sm font-medium text-text-primary">Most Studied Subject</p>
            <p className="text-lg font-bold text-text-primary">{mostStudied}</p>
          </div>
        </div>
      </Card>

      {/* Focus Time by Day */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">Focus Time by Day (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={focusByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="label" stroke={axisColor} fontSize={12} />
            <YAxis stroke={axisColor} fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} formatter={((v: any) => [pomodoroService.formatDuration(Number(v)), 'Focus Time']) as any} />
            <Bar dataKey="minutes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Focus Time by Subject */}
      {focusBySubject.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-text-primary mb-4">Focus Time by Subject</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={focusBySubject}
                  dataKey="minutes"
                  nameKey="subject"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {focusBySubject.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={((v: any) => pomodoroService.formatDuration(Number(v))) as any} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {focusBySubject.map((item, i) => (
                <div key={item.subject} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-sm text-text-secondary flex-1">{item.subject}</span>
                  <span className="text-sm font-medium text-text-primary">{pomodoroService.formatDuration(item.minutes)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Completed Sessions Line Chart */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">Completed Sessions (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={sessionsByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="label" stroke={axisColor} fontSize={12} />
            <YAxis stroke={axisColor} fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Weekly Goal Progress */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">Weekly Goal Progress</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[{ name: 'Weekly Goal', progress: weeklyGoalProgress, target: 100 }]}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
            <YAxis stroke={axisColor} fontSize={12} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} formatter={((v: any) => `${v}%`) as any} />
            <Bar dataKey="progress" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-text-muted text-center mt-2">
          {pomodoroService.formatDuration(weeklyFocus)} / {pomodoroService.formatDuration(data.goals.weeklyFocusMinutes)}
        </p>
      </Card>

      {data.focusHistory.length === 0 && (
        <Card className="p-8 text-center">
          <Clock className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
          <p className="text-text-muted">No study data yet. Complete a focus session to see your analytics!</p>
        </Card>
      )}
    </div>
  );
}
