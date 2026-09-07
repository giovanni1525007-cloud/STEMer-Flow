import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, ArrowRight, ArrowLeft, Rocket, BookOpen, Target, CalendarDays, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { Button } from '@/components/ui/Button';
import { getSubjectsForGrade } from '@/types';
import * as LucideIcons from 'lucide-react';

export function Onboarding() {
  const { user, updateUser } = useAuth();
  const { addSubject, updateGoals } = useAppData();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(120); // minutes
  const [customDaily, setCustomDaily] = useState('');
  const [planningDays, setPlanningDays] = useState(7);
  const [customDays, setCustomDays] = useState('');

  const isGrade12 = (user?.grade || 'Grade 10') === 'Grade 12';
  const availableSubjects = getSubjectsForGrade(user?.grade || 'Grade 10');

  const totalSteps = 5;

  const toggleSubject = (name: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleFinish = async () => {
    selectedSubjects.forEach((name) => {
      const def = availableSubjects.find((s) => s.name === name);
      if (def) {
        addSubject({ name: def.name, icon: def.icon, color: def.color, totalSessions: 0 });
      }
    });

    updateGoals({ dailyFocusMinutes: dailyGoal });

    await updateUser({ onboarded: true });
    showToast('Welcome to STEMer Flow!', 'success');
  };

  const canProceed = () => {
    if (step === 1) return isGrade12 || selectedSubjects.length > 0;
    if (step === 2) return dailyGoal > 0;
    if (step === 3) return planningDays > 0;
    return true;
  };

  const steps = [
    {
      icon: Rocket,
      title: 'Welcome to STEMer Flow',
      subtitle: "Let's personalize your study system.",
      content: (
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-blue/30"
          >
            <Rocket className="w-12 h-12 text-white" />
          </motion.div>
          <p className="text-text-muted max-w-sm mx-auto">
            We'll set up your subjects, study goals, and planning preferences in just a few steps.
          </p>
        </div>
      ),
    },
    {
      icon: BookOpen,
      title: 'Choose your subjects',
      subtitle: 'Select only the subjects you study.',
      content: isGrade12 ? (
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-purple/30"
          >
            <Clock className="w-10 h-10 text-white" />
          </motion.div>
          <p className="text-lg font-semibold text-text-primary mb-2">Coming Soon</p>
          <p className="text-sm text-text-muted max-w-xs mx-auto">
            Grade 12 subject selection will be available soon. You can still set your goals and start focusing!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableSubjects.map((subject) => {
            const selected = selectedSubjects.includes(subject.name);
            const Icon = (LucideIcons as any)[subject.icon] || LucideIcons.BookOpen;
            return (
              <motion.button
                key={subject.name}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSubject(subject.name)}
                className={`relative p-4 rounded-2xl border transition-all text-left ${
                  selected
                    ? 'border-brand-blue bg-brand-blue/10 shadow-lg shadow-brand-blue/10'
                    : 'border-border bg-surface hover:border-border-strong'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: subject.color }} />
                </div>
                <p className="text-sm font-medium text-text-primary">{subject.name}</p>
                {selected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-blue flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      ),
    },
    {
      icon: Target,
      title: 'Set your study goal',
      subtitle: 'How much do you want to study each day?',
      content: (
        <div className="space-y-3">
          {[
            { label: '1 hour/day', value: 60 },
            { label: '2 hours/day', value: 120 },
            { label: '3 hours/day', value: 180 },
            { label: 'Custom', value: -1 },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setDailyGoal(opt.value === -1 ? parseInt(customDaily) || 60 : opt.value)}
              className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                (opt.value === -1 && dailyGoal === parseInt(customDaily) && customDaily !== '') ||
                dailyGoal === opt.value
                  ? 'border-brand-blue bg-brand-blue/10'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <span className="text-sm font-medium text-text-primary">{opt.label}</span>
              {((opt.value === -1 && dailyGoal === parseInt(customDaily) && customDaily !== '') || dailyGoal === opt.value) && (
                <Check className="w-5 h-5 text-brand-blue" />
              )}
            </button>
          ))}
          <input
            type="number"
            placeholder="Enter minutes per day"
            value={customDaily}
            onChange={(e) => {
              setCustomDaily(e.target.value);
              if (e.target.value) setDailyGoal(parseInt(e.target.value));
            }}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-all"
          />
        </div>
      ),
    },
    {
      icon: CalendarDays,
      title: 'Choose planning period',
      subtitle: 'How many days should your plans cover?',
      content: (
        <div className="space-y-3">
          {[3, 4, 5, 7].map((days) => (
            <button
              key={days}
              onClick={() => setPlanningDays(days)}
              className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                planningDays === days
                  ? 'border-brand-blue bg-brand-blue/10'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <span className="text-sm font-medium text-text-primary">{days} Days</span>
              {planningDays === days && <Check className="w-5 h-5 text-brand-blue" />}
            </button>
          ))}
          <button
            onClick={() => {
              setPlanningDays(-1);
              if (customDays) setPlanningDays(parseInt(customDays));
            }}
            className={`w-full p-4 rounded-2xl border transition-all text-left ${
              planningDays === parseInt(customDays) && customDays !== ''
                ? 'border-brand-blue bg-brand-blue/10'
                : 'border-border bg-surface hover:border-border-strong'
            }`}
          >
            <span className="text-sm font-medium text-text-primary">Custom</span>
          </button>
          <input
            type="number"
            placeholder="Enter number of days"
            value={customDays}
            onChange={(e) => {
              setCustomDays(e.target.value);
              if (e.target.value) setPlanningDays(parseInt(e.target.value));
            }}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-all"
          />
        </div>
      ),
    },
    {
      icon: Zap,
      title: 'Ready to Flow?',
      subtitle: 'Your personalized study system is ready.',
      content: (
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-6"
          >
            <img src="/STEMers_P.png" alt="STEMer Flow" className="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-brand-blue/30" />
          </motion.div>
          <div className="space-y-2 mb-6">
            <p className="text-sm text-text-muted">
              <span className="font-semibold text-text-primary">{isGrade12 ? 'Coming Soon' : selectedSubjects.length}</span> subjects selected
            </p>
            <p className="text-sm text-text-muted">
              <span className="font-semibold text-text-primary">{dailyGoal}</span> minutes daily goal
            </p>
            <p className="text-sm text-text-muted">
              <span className="font-semibold text-text-primary">{planningDays}</span> day planning period
            </p>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-8 bg-brand-blue' : i < step ? 'w-1.5 bg-brand-blue/50' : 'w-1.5 bg-border-strong'
              }`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
              <current.icon className="w-5 h-5 text-brand-blue" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Step {step + 1} of {totalSteps}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-text-primary mb-1">{current.title}</h2>
              <p className="text-sm text-text-muted mb-6">{current.subtitle}</p>
              {current.content}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < totalSteps - 1 ? (
              <Button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} size="lg">
                Enter STEMer Flow
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
