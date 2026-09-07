import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Clock, CheckCircle2, ArrowRight, Lock, Phone, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import type { Grade, Language } from '@/types';

type AuthMode = 'signin' | 'signup';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sign up state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [grade, setGrade] = useState<Grade>('Grade 10');
  const [language, setLanguage] = useState<Language>('French');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sign in state
  const [signInPhone, setSignInPhone] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const validateSignUp = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[+]?[\d\s-]{8,}$/.test(phone)) e.phone = 'Please enter a valid phone number';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    setLoading(true);
    const { error } = await signUp({ fullName, phone, password, grade, language });
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Welcome to STEMer Flow!', 'success');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(signInPhone, signInPassword);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Welcome back!', 'success');
    }
  };

  return (
    <div className="min-h-screen flex">
      <AnimatedBackground />

      {/* Left side - visual */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center p-12 overflow-hidden">
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <img src="/STEMers_P.png" alt="STEMer Flow" className="w-14 h-14 rounded-2xl object-cover shadow-xl shadow-brand-blue/30" />
            <div>
              <h1 className="text-3xl font-bold text-text-primary">STEMer Flow</h1>
              <p className="text-sm text-text-muted">Plan. Focus. Achieve.</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-text-secondary mb-10 leading-relaxed"
          >
            Your complete space to organize your studies, manage your workload, and build better habits.
          </motion.p>

          {/* Floating cards */}
          <div className="space-y-4">
            {[
              { icon: Flame, label: '7 Day Streak', color: 'text-accent-warning', delay: 0.2 },
              { icon: Zap, label: '+20 XP', color: 'text-brand-purple', delay: 0.3 },
              { icon: Clock, label: '3h 40m Focused Today', color: 'text-brand-blue', delay: 0.4 },
              { icon: CheckCircle2, label: 'Physics Session Completed', color: 'text-accent-success', delay: 0.5 },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: card.delay }}
                className="glass rounded-2xl p-4 flex items-center gap-3 w-fit"
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
                <span className="text-sm font-medium text-text-primary">{card.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Decorative floating shapes */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 right-20 w-32 h-32 rounded-full border-2 border-brand-blue/20"
        />
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-32 left-16 w-20 h-20 rounded-2xl border-2 border-brand-purple/20 rotate-12"
        />
      </div>

      {/* Right side - auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/STEMers_P.png" alt="STEMer Flow" className="w-12 h-12 rounded-2xl object-cover shadow-xl shadow-brand-blue/30" />
            <div>
              <h1 className="text-2xl font-bold text-text-primary">STEMer Flow</h1>
              <p className="text-xs text-text-muted">Plan. Focus. Achieve.</p>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl mb-6">
              {(['signup', 'signin'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErrors({}); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    mode === m ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {m === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {mode === 'signup' ? (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignUp}
                  className="space-y-4"
                >
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={errors.fullName}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={errors.phone}
                    type="tel"
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                  />
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
                  <Button type="submit" size="lg" loading={loading} className="w-full">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignIn}
                  className="space-y-4"
                >
                  <Input
                    label="Phone Number"
                    placeholder="+1234567890"
                    value={signInPhone}
                    onChange={(e) => setSignInPhone(e.target.value)}
                    type="tel"
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded accent-brand-blue"
                      />
                      <span className="text-sm text-text-secondary">Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-sm text-brand-blue hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <Button type="submit" size="lg" loading={loading} className="w-full">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Password Recovery" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-brand-blue" />
          </div>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            Password recovery will be available when cloud authentication is connected.
            For now, please make sure to remember your password or create a new account.
          </p>
          <Button onClick={() => setForgotOpen(false)} className="w-full">
            Got it
          </Button>
        </div>
      </Modal>
    </div>
  );
}
