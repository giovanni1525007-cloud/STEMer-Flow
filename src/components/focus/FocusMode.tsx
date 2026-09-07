import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, SkipForward, Settings, CheckCircle2,
  Coffee, Brain, X,
} from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { pomodoroService } from '@/services/pomodoroService';
import { POMODORO_PRESETS } from '@/types';
import type { StudySession } from '@/types';

type Phase = 'idle' | 'focus' | 'break' | 'longBreak' | 'completed';

export function FocusMode() {
  const { data, updatePomodoroSettings, completeSession, addFocusHistory } = useAppData();
  const { showToast } = useToast();
  const settings = data.pomodoroSettings;

  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [cycle, setCycle] = useState(1);
  const [running, setRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [completedFocus, setCompletedFocus] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = phase === 'focus' ? settings.focusDuration * 60
    : phase === 'break' ? settings.breakDuration * 60
    : phase === 'longBreak' ? settings.longBreakDuration * 60
    : settings.focusDuration * 60;

  const updateTimer = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        if (phase === 'focus') {
          // Focus completed
          setCompletedFocus(true);
          if (selectedSession) {
            const { xpGained, leveledUp } = completeSession(selectedSession.id, settings.focusDuration);
            showToast('Focus session complete!', 'success', xpGained);
            if (leveledUp) showToast('Level Up!', 'xp');
          } else {
            const { xpGained, leveledUp } = addFocusHistory({
              id: Date.now().toString(36),
              date: new Date().toISOString().split('T')[0],
              subjectName: 'General Study',
              sessionTitle: 'Focus Session',
              duration: settings.focusDuration,
              completedAt: new Date().toISOString(),
            });
            showToast('Focus session complete!', 'success', xpGained);
            if (leveledUp) showToast('Level Up!', 'xp');
          }
          setRunning(false);
          setPhase('completed');
        }
        return 0;
      }
      return prev - 1;
    });
  }, [phase, selectedSession, settings.focusDuration, completeSession, addFocusHistory, showToast]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(updateTimer, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [running, updateTimer]);

  const startFocus = () => {
    setPhase('focus');
    setTimeLeft(settings.focusDuration * 60);
    setRunning(true);
  };

  const startBreak = (isLong: boolean) => {
    setPhase(isLong ? 'longBreak' : 'break');
    setTimeLeft(isLong ? settings.longBreakDuration * 60 : settings.breakDuration * 60);
    setRunning(true);
  };

  const pause = () => setRunning(false);
  const resume = () => setRunning(true);

  const reset = () => {
    setRunning(false);
    setPhase('idle');
    setTimeLeft(settings.focusDuration * 60);
    setCycle(1);
    setCompletedFocus(false);
  };

  const skip = () => {
    setRunning(false);
    if (phase === 'focus') {
      const isLong = cycle % settings.longBreakAfter === 0;
      setPhase(isLong ? 'longBreak' : 'break');
      setTimeLeft(isLong ? settings.longBreakDuration * 60 : settings.breakDuration * 60);
    } else {
      setPhase('focus');
      setTimeLeft(settings.focusDuration * 60);
      if (phase !== 'idle') setCycle((c) => c + 1);
    }
  };

  const nextCycle = () => {
    const isLong = cycle % settings.longBreakAfter === 0;
    setPhase(isLong ? 'longBreak' : 'break');
    setTimeLeft(isLong ? settings.longBreakDuration * 60 : settings.breakDuration * 60);
    setRunning(true);
  };

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const pendingSessions = data.sessions.filter((s) => !s.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Focus Mode</h1>
          <p className="text-text-muted mt-1">Custom Pomodoro timer for deep study sessions.</p>
        </div>
        <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Session selector */}
      {phase === 'idle' && (
        <Card className="p-5">
          <h3 className="font-medium text-text-primary mb-3">Choose a session to focus on (optional)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            <button
              onClick={() => setSelectedSession(null)}
              className={`p-3 rounded-xl border text-left transition-all ${
                !selectedSession ? 'border-brand-blue bg-brand-blue/10' : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <p className="text-sm font-medium text-text-primary">General Study</p>
              <p className="text-xs text-text-muted">No specific session</p>
            </button>
            {pendingSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedSession?.id === s.id ? 'border-brand-blue bg-brand-blue/10' : 'border-border bg-surface hover:border-border-strong'
                }`}
              >
                <p className="text-sm font-medium text-text-primary truncate">{s.title}</p>
                <p className="text-xs text-text-muted">{s.subjectName} · {pomodoroService.formatDuration(s.duration)}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Timer */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          {/* Glow */}
          {running && phase === 'focus' && (
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-brand-blue/20 blur-3xl"
            />
          )}

          <svg width="320" height="320" className="transform -rotate-90">
            <circle
              cx="160" cy="160" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-bg-tertiary"
            />
            <motion.circle
              cx="160" cy="160" r={radius}
              fill="none"
              stroke="url(#focusGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transition={{ duration: 0.5 }}
              style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))' }}
            />
            <defs>
              <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--color-brand-blue))" />
                <stop offset="50%" stopColor="rgb(var(--color-brand-purple))" />
                <stop offset="100%" stopColor="rgb(var(--color-brand-cyan))" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {selectedSession && phase !== 'idle' && (
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{selectedSession.subjectName}</p>
            )}
            {selectedSession && phase === 'idle' && (
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{selectedSession.subjectName}</p>
            )}
            <p className="text-5xl font-bold text-text-primary font-mono">
              {pomodoroService.formatTime(timeLeft)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={phase === 'focus' ? 'info' : phase === 'break' || phase === 'longBreak' ? 'success' : 'default'}>
                {phase === 'idle' ? 'Ready' : phase === 'focus' ? 'Focus' : phase === 'break' ? 'Break' : phase === 'longBreak' ? 'Long Break' : 'Completed'}
              </Badge>
            </div>
            {phase !== 'idle' && phase !== 'completed' && (
              <p className="text-xs text-text-muted mt-2">
                Cycle {cycle} / {settings.totalCycles}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-8">
          {phase === 'idle' && (
            <Button size="lg" onClick={startFocus}>
              <Play className="w-5 h-5" />
              Start
            </Button>
          )}
          {running && (
            <Button size="lg" variant="secondary" onClick={pause}>
              <Pause className="w-5 h-5" />
              Pause
            </Button>
          )}
          {!running && phase !== 'idle' && phase !== 'completed' && (
            <Button size="lg" onClick={resume}>
              <Play className="w-5 h-5" />
              Resume
            </Button>
          )}
          {phase !== 'idle' && (
            <>
              <Button size="lg" variant="ghost" onClick={reset}>
                <RotateCcw className="w-5 h-5" />
                Reset
              </Button>
              <Button size="lg" variant="ghost" onClick={skip}>
                <SkipForward className="w-5 h-5" />
                Skip
              </Button>
            </>
          )}
        </div>

        {/* Completion / Next actions */}
        <AnimatePresence>
          {phase === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-accent-success/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-accent-success" />
              </motion.div>
              <p className="text-lg font-semibold text-text-primary mb-1">Focus Complete!</p>
              <p className="text-sm text-text-muted mb-4">Great work. Take a break or continue.</p>
              <div className="flex items-center gap-3 justify-center">
                <Button onClick={() => startBreak(cycle % settings.longBreakAfter === 0)}>
                  <Coffee className="w-4 h-4" />
                  Take a Break
                </Button>
                <Button variant="secondary" onClick={() => {
                  setCycle((c) => c + 1);
                  startFocus();
                }}>
                  <Brain className="w-4 h-4" />
                  Next Cycle
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'break' || phase === 'longBreak' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <Coffee className="w-8 h-8 text-accent-success mx-auto mb-2" />
            <p className="text-sm text-text-muted mb-4">
              {phase === 'longBreak' ? 'Long break — rest well!' : 'Break time — relax!'}
            </p>
            <Button onClick={() => {
              if (phase === 'break' || phase === 'longBreak') {
                setCycle((c) => c + 1);
              }
              startFocus();
            }}>
              <Brain className="w-4 h-4" />
              Start Next Focus
            </Button>
          </motion.div>
        ) : null}
      </div>

      {/* Presets */}
      {phase === 'idle' && (
        <Card className="p-5">
          <h3 className="font-medium text-text-primary mb-3">Quick Presets</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {POMODORO_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  updatePomodoroSettings({
                    focusDuration: preset.focus,
                    breakDuration: preset.break,
                    longBreakDuration: preset.longBreak,
                    longBreakAfter: preset.after,
                  });
                  setTimeLeft(preset.focus * 60);
                  showToast(`${preset.name} preset applied`, 'info');
                }}
                className="p-3 rounded-xl border border-border bg-surface hover:border-brand-blue/30 transition-all text-center"
              >
                <p className="text-sm font-medium text-text-primary">{preset.name}</p>
                <p className="text-xs text-text-muted">{preset.focus}/{preset.break}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Settings Modal */}
      <FocusSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function FocusSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, updatePomodoroSettings } = useAppData();
  const { showToast } = useToast();
  const settings = data.pomodoroSettings;
  const [focus, setFocus] = useState(settings.focusDuration);
  const [breakTime, setBreakTime] = useState(settings.breakDuration);
  const [longBreak, setLongBreak] = useState(settings.longBreakDuration);
  const [longBreakAfter, setLongBreakAfter] = useState(settings.longBreakAfter);
  const [cycles, setCycles] = useState(settings.totalCycles);

  return (
    <Modal open={open} onClose={onClose} title="Pomodoro Settings" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Focus (min)" type="number" value={focus} onChange={(e) => setFocus(parseInt(e.target.value) || 25)} />
          <Input label="Break (min)" type="number" value={breakTime} onChange={(e) => setBreakTime(parseInt(e.target.value) || 5)} />
          <Input label="Long Break (min)" type="number" value={longBreak} onChange={(e) => setLongBreak(parseInt(e.target.value) || 15)} />
          <Input label="Long Break After" type="number" value={longBreakAfter} onChange={(e) => setLongBreakAfter(parseInt(e.target.value) || 4)} />
          <Input label="Total Cycles" type="number" value={cycles} onChange={(e) => setCycles(parseInt(e.target.value) || 4)} />
        </div>
        <Button
          className="w-full"
          onClick={() => {
            updatePomodoroSettings({
              focusDuration: focus,
              breakDuration: breakTime,
              longBreakDuration: longBreak,
              longBreakAfter,
              totalCycles: cycles,
            });
            showToast('Settings saved', 'success');
            onClose();
          }}
        >
          Save Settings
        </Button>
      </div>
    </Modal>
  );
}
