import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Clock, Timer, Brain, BarChart3 } from 'lucide-react';

const items = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/sessions', label: 'Sessions', icon: Clock, end: false },
  { to: '/app/focus', label: 'Focus', icon: Timer, end: false },
  { to: '/app/planner', label: 'Planner', icon: Brain, end: false },
  { to: '/app/analytics', label: 'Stats', icon: BarChart3, end: false },
];

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-strong border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                isActive ? 'text-brand-blue' : 'text-text-muted'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
