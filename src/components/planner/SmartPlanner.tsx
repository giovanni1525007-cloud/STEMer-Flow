import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Calendar, Sparkles, Clock, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { pomodoroService } from '@/services/pomodoroService';

export function SmartPlanner() {
  const { data, generatePlan } = useAppData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(7);
  const [customDays, setCustomDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    'Analyzing your workload...',
    'Balancing your sessions...',
    'Your plan is ready ✨',
  ];

  const handleGenerate = () => {
    const actualDuration = duration === -1 ? parseInt(customDays) || 7 : duration;
    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < 2) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 800);

    setTimeout(() => {
      clearInterval(stepInterval);
      const start = new Date(startDate);
      generatePlan(start, actualDuration);
      setLoading(false);
      showToast('Smart plan generated!', 'success');
      navigate('/app/weekly');
    }, 2400);
  };

  const uncompletedSessions = data.sessions.filter((s) => !s.completed);
  const uncompletedTasks = data.sharedTasks.filter((t) => !t.completed);
  const totalWork = uncompletedSessions.reduce((sum, s) => sum + s.duration, 0) + uncompletedTasks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          Smart Planner
          <Brain className="w-6 h-6 text-brand-purple" />
        </h1>
        <p className="text-text-muted mt-1">Generate a balanced study plan across multiple days.</p>
      </div>

      {/* Workload summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card delay={0.05} className="p-4">
          <Clock className="w-5 h-5 text-brand-blue mb-2" />
          <p className="text-2xl font-bold text-text-primary">{pomodoroService.formatDuration(totalWork)}</p>
          <p className="text-xs text-text-muted">Total Workload</p>
        </Card>
        <Card delay={0.1} className="p-4">
          <Brain className="w-5 h-5 text-brand-purple mb-2" />
          <p className="text-2xl font-bold text-text-primary">{uncompletedSessions.length}</p>
          <p className="text-xs text-text-muted">Pending Sessions</p>
        </Card>
        <Card delay={0.15} className="p-4">
          <Zap className="w-5 h-5 text-accent-warning mb-2" />
          <p className="text-2xl font-bold text-text-primary">{uncompletedTasks.length}</p>
          <p className="text-xs text-text-muted">Pending Tasks</p>
        </Card>
      </div>

      {/* Planner config */}
      <Card className="p-6">
        <div className="space-y-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Planning Duration</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[3, 4, 5, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                    duration === d
                      ? 'border-brand-blue bg-brand-blue/10 text-text-primary'
                      : 'border-border bg-surface hover:border-border-strong text-text-secondary'
                  }`}
                >
                  {d} Days
                </button>
              ))}
              <button
                onClick={() => setDuration(-1)}
                className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                  duration === -1
                    ? 'border-brand-blue bg-brand-blue/10 text-text-primary'
                    : 'border-border bg-surface hover:border-border-strong text-text-secondary'
                }`}
              >
                Custom
              </button>
            </div>
            {duration === -1 && (
              <Input
                className="mt-2"
                type="number"
                placeholder="Enter number of days"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
              />
            )}
          </div>
          <Button onClick={handleGenerate} size="lg" className="w-full" disabled={loading || (totalWork === 0)}>
            <Sparkles className="w-5 h-5" />
            Generate Smart Plan
          </Button>
          {totalWork === 0 && (
            <p className="text-xs text-text-muted text-center">No pending work to plan. Add sessions or tasks first.</p>
          )}
        </div>
      </Card>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <Card className="p-8 max-w-sm w-full mx-4">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center mx-auto mb-6"
                >
                  <Brain className="w-8 h-8 text-white" />
                </motion.div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-text-primary font-medium"
                  >
                    {loadingMessages[loadingStep]}
                  </motion.p>
                </AnimatePresence>
                <div className="flex justify-center gap-1.5 mt-4">
                  {loadingMessages.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${i <= loadingStep ? 'w-8 bg-brand-blue' : 'w-1.5 bg-border-strong'}`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing plans */}
      {data.weeklyPlans.length > 0 && (
        <div>
          <h2 className="font-semibold text-text-primary mb-3">Recent Plans</h2>
          <div className="space-y-2">
            {data.weeklyPlans.slice(0, 3).map((plan) => (
              <Card key={plan.id} hover className="p-4" onClick={() => navigate('/app/weekly')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Plan from {new Date(plan.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-text-muted">{plan.days.length} days · {plan.days.reduce((sum, d) => sum + d.totalMinutes, 0)} min total</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
