import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, Clock, ListTodo, CalendarDays, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/context/AppDataContext';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { data } = useAppData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: { type: string; label: string; sublabel: string; path: string; icon: any }[] = [];

    data.subjects.forEach((s) => {
      if (s.name.toLowerCase().includes(q)) {
        items.push({ type: 'Subject', label: s.name, sublabel: `${s.totalSessions} sessions`, path: '/app/sessions', icon: BookOpen });
      }
    });
    data.sessions.forEach((s) => {
      if (s.title.toLowerCase().includes(q) || s.subjectName.toLowerCase().includes(q)) {
        items.push({ type: 'Session', label: s.title, sublabel: s.subjectName, path: '/app/sessions', icon: Clock });
      }
    });
    data.sharedTasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q)) {
        items.push({ type: 'Task', label: t.title, sublabel: 'Shared Task', path: '/app/tasks', icon: ListTodo });
      }
    });
    if ('planner'.includes(q) || 'plan'.includes(q)) items.push({ type: 'Page', label: 'Smart Planner', sublabel: 'Generate plans', path: '/app/planner', icon: Target });
    if ('weekly'.includes(q)) items.push({ type: 'Page', label: 'Weekly Plan', sublabel: 'View weekly schedule', path: '/app/weekly', icon: CalendarDays });
    if ('analytics'.includes(q) || 'stats'.includes(q)) items.push({ type: 'Page', label: 'Analytics', sublabel: 'Study statistics', path: '/app/analytics', icon: Target });
    if ('focus'.includes(q)) items.push({ type: 'Page', label: 'Focus Mode', sublabel: 'Pomodoro timer', path: '/app/focus', icon: Clock });

    return items.slice(0, 8);
  }, [query, data]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else return;
      }
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        navigate(results[selectedIndex].path);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selectedIndex, navigate, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-xl glass-strong rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subjects, sessions, tasks, pages..."
                className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-sm"
              />
              <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && query.trim() && (
                <p className="text-sm text-text-muted text-center py-8">No results found</p>
              )}
              {results.length === 0 && !query.trim() && (
                <p className="text-sm text-text-muted text-center py-8">Start typing to search...</p>
              )}
              {results.map((item, i) => (
                <button
                  key={i}
                  onClick={() => { navigate(item.path); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    i === selectedIndex ? 'bg-surface-hover' : 'hover:bg-surface-hover/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.label}</p>
                    <p className="text-xs text-text-muted">{item.sublabel}</p>
                  </div>
                  <span className="text-xs text-text-muted px-2 py-0.5 rounded-md bg-bg-tertiary">{item.type}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
