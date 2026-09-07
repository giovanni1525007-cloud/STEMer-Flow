import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Palette, Target, Timer, Bell, Moon, Sun, Monitor, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { pomodoroService } from '@/services/pomodoroService';
import type { Grade, Language } from '@/types';

export function Settings() {
  const { user, updateUser } = useAuth();
  const { data, updatePomodoroSettings, updateGoals, resetData } = useAppData();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [grade, setGrade] = useState<Grade>(user?.grade || 'Grade 10');
  const [language, setLanguage] = useState<Language>(user?.language || 'French');

  const [defaultDuration, setDefaultDuration] = useState(45);
  const [dailyGoal, setDailyGoal] = useState(data.goals.dailyFocusMinutes);
  const [weeklyGoal, setWeeklyGoal] = useState(data.goals.weeklyFocusMinutes);

  const [focusTime, setFocusTime] = useState(data.pomodoroSettings.focusDuration);
  const [breakTime, setBreakTime] = useState(data.pomodoroSettings.breakDuration);
  const [longBreak, setLongBreak] = useState(data.pomodoroSettings.longBreakDuration);
  const [cycles, setCycles] = useState(data.pomodoroSettings.totalCycles);

  const [sessionReminders, setSessionReminders] = useState(true);
  const [goalReminders, setGoalReminders] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);

  const saveProfile = async () => {
    await updateUser({ fullName: name, phone, grade, language });
    showToast('Profile saved', 'success');
  };

  const savePreferences = () => {
    updateGoals({ dailyFocusMinutes: dailyGoal, weeklyFocusMinutes: weeklyGoal });
    showToast('Study preferences saved', 'success');
  };

  const savePomodoro = () => {
    updatePomodoroSettings({
      focusDuration: focusTime,
      breakDuration: breakTime,
      longBreakDuration: longBreak,
      totalCycles: cycles,
    });
    showToast('Pomodoro settings saved', 'success');
  };

  const themeOptions = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted mt-1">Customize your STEMer Flow experience.</p>
      </div>

      {/* Profile */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-brand-blue" />
          <h2 className="font-semibold text-text-primary">Profile</h2>
        </div>
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value as Grade)}
              options={[
                { value: 'Grade 10', label: 'Grade 10' },
                { value: 'Grade 11', label: 'Grade 11' },
                { value: 'Grade 12', label: 'Grade 12' },
              ]}
            />
            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              options={[
                { value: 'French', label: 'French' },
                { value: 'German', label: 'German' },
              ]}
            />
          </div>
          <Button onClick={saveProfile}>Save Profile</Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-brand-purple" />
          <h2 className="font-semibold text-text-primary">Appearance</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                theme === opt.id
                  ? 'border-brand-blue bg-brand-blue/10'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <opt.icon className={`w-6 h-6 ${theme === opt.id ? 'text-brand-blue' : 'text-text-muted'}`} />
              <span className={`text-sm font-medium ${theme === opt.id ? 'text-text-primary' : 'text-text-secondary'}`}>{opt.label}</span>
              {theme === opt.id && <Check className="w-4 h-4 text-brand-blue" />}
            </button>
          ))}
        </div>
      </Card>

      {/* Study Preferences */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-accent-success" />
          <h2 className="font-semibold text-text-primary">Study Preferences</h2>
        </div>
        <div className="space-y-4">
          <Select
            label="Default Session Duration"
            value={defaultDuration.toString()}
            onChange={(e) => setDefaultDuration(parseInt(e.target.value))}
            options={[
              { value: '30', label: '30 minutes' },
              { value: '45', label: '45 minutes' },
              { value: '60', label: '60 minutes' },
              { value: '90', label: '90 minutes' },
              { value: '120', label: '120 minutes' },
            ]}
          />
          <div>
            <Input
              label="Daily Goal (minutes)"
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value) || 120)}
            />
            <p className="text-xs text-text-muted mt-1">{pomodoroService.formatDuration(dailyGoal)}</p>
          </div>
          <div>
            <Input
              label="Weekly Goal (minutes)"
              type="number"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 600)}
            />
            <p className="text-xs text-text-muted mt-1">{pomodoroService.formatDuration(weeklyGoal)}</p>
          </div>
          <Button onClick={savePreferences}>Save Preferences</Button>
        </div>
      </Card>

      {/* Pomodoro */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-5 h-5 text-brand-cyan" />
          <h2 className="font-semibold text-text-primary">Pomodoro</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Default Focus (min)" type="number" value={focusTime} onChange={(e) => setFocusTime(parseInt(e.target.value) || 25)} />
          <Input label="Default Break (min)" type="number" value={breakTime} onChange={(e) => setBreakTime(parseInt(e.target.value) || 5)} />
          <Input label="Long Break (min)" type="number" value={longBreak} onChange={(e) => setLongBreak(parseInt(e.target.value) || 15)} />
          <Input label="Cycles" type="number" value={cycles} onChange={(e) => setCycles(parseInt(e.target.value) || 4)} />
        </div>
        <Button className="mt-4" onClick={savePomodoro}>Save Pomodoro Settings</Button>
      </Card>

      {/* Notifications */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-accent-warning" />
          <h2 className="font-semibold text-text-primary">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Session Reminders', value: sessionReminders, setter: setSessionReminders },
            { label: 'Goal Reminders', value: goalReminders, setter: setGoalReminders },
            { label: 'Streak Reminders', value: streakReminders, setter: setStreakReminders },
          ].map((setting) => (
            <label key={setting.label} className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-bg-secondary hover:bg-surface-hover transition-colors">
              <span className="text-sm text-text-secondary">{setting.label}</span>
              <button
                onClick={() => setting.setter(!setting.value)}
                className={`relative w-11 h-6 rounded-full transition-colors ${setting.value ? 'bg-brand-blue' : 'bg-border-strong'}`}
              >
                <motion.div
                  animate={{ x: setting.value ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                />
              </button>
            </label>
          ))}
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-5 border-accent-error/20">
        <h2 className="font-semibold text-accent-error mb-2">Reset Data</h2>
        <p className="text-sm text-text-muted mb-4">This will permanently delete all your study data, sessions, tasks, and stats.</p>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('Are you sure? This will delete ALL your data.')) {
              resetData();
              showToast('All data reset', 'info');
            }
          }}
        >
          Reset All Data
        </Button>
      </Card>
    </div>
  );
}
