import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Clock, ListTodo, Brain, CalendarDays,
  Timer, Target, BarChart3, Trophy, Settings, LogOut, X, Zap, Flame,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';
import { gamificationService } from '@/services/gamificationService';
import { Sun, Moon } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/sessions', label: 'Sessions', icon: Clock },
  { to: '/app/tasks', label: 'Shared Tasks', icon: ListTodo },
  { to: '/app/planner', label: 'Smart Planner', icon: Brain },
  { to: '/app/weekly', label: 'Weekly Plan', icon: CalendarDays },
  { to: '/app/focus', label: 'Focus', icon: Timer },
  { to: '/app/goals', label: 'Goals', icon: Target },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/achievements', label: 'Achievements', icon: Trophy },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { data } = useAppData();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const levelInfo = gamificationService.getLevelInfo(data.stats.xp);
  const levelProgress = gamificationService.getLevelProgress(data.stats.xp);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed lg:translate-x-0 top-0 left-0 h-full w-72 glass-strong z-50 flex flex-col"
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/STEMers_P.png" alt="STEMer Flow" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
            <div>
              <h1 className="font-bold text-text-primary text-lg leading-tight">STEMer Flow</h1>
              <p className="text-xs text-text-muted">Plan. Focus. Achieve.</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-text-muted hover:text-text-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/20'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Level progress */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-text-secondary">Level {levelInfo.level}</span>
            <span className="text-xs text-text-muted">{levelInfo.name}</span>
          </div>
          <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress.percent}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-brand-blue to-brand-purple rounded-full"
            />
          </div>
          <p className="text-xs text-text-muted mt-1">{data.stats.xp} XP</p>
        </div>

        {/* User profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-semibold text-sm">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.fullName}</p>
              <p className="text-xs text-text-muted">{user?.grade}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary transition-colors text-xs"
            >
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {isDark ? 'Dark' : 'Light'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-3 py-2 rounded-lg bg-surface-hover text-text-secondary hover:text-accent-error transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
