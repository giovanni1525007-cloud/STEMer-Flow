import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, Flame, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import { gamificationService } from '@/services/gamificationService';

interface TopBarProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

const pageNames: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/sessions': 'Sessions',
  '/app/tasks': 'Shared Tasks',
  '/app/planner': 'Smart Planner',
  '/app/weekly': 'Weekly Plan',
  '/app/focus': 'Focus Mode',
  '/app/goals': 'Goals',
  '/app/analytics': 'Analytics',
  '/app/achievements': 'Achievements',
  '/app/calendar': 'Calendar',
  '/app/settings': 'Settings',
  '/app/notifications': 'Notifications',
};

export function TopBar({ onMenuClick, onSearchClick }: TopBarProps) {
  const { user } = useAuth();
  const { data } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const pageName = pageNames[location.pathname] || 'STEMer Flow';
  const unreadCount = data.notifications.filter((n) => !n.read).length;
  const levelInfo = gamificationService.getLevelInfo(data.stats.xp);

  return (
    <header className="sticky top-0 z-30 glass border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-hover text-text-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-text-primary">{pageName}</h2>
            <p className="text-xs text-text-muted">
              {greeting}, {user?.fullName?.split(' ')[0]} 👋
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-hover border border-border text-text-muted hover:text-text-primary hover:border-border-strong transition-all text-sm w-40 md:w-56"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden md:inline ml-auto text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">⌘K</kbd>
          </button>

          {/* Streak */}
          {data.stats.currentStreak > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-warning/10 text-accent-warning text-sm font-medium">
              <Flame className="w-4 h-4" />
              {data.stats.currentStreak}
            </div>
          )}

          {/* XP/Level */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-purple/10 text-brand-purple text-sm font-medium">
            <Zap className="w-4 h-4" />
            {data.stats.xp} XP
          </div>

          {/* Notifications */}
          <button
            onClick={() => navigate('/app/notifications')}
            className="relative p-2 rounded-xl hover:bg-surface-hover text-text-secondary transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-error text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
