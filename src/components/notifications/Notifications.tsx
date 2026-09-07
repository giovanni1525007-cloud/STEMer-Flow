import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, Clock, AlertCircle, Target, Flame, Trophy,
} from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { NotificationType } from '@/types';

const typeConfig: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  session: { icon: Clock, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
  deadline: { icon: AlertCircle, color: 'text-accent-error', bg: 'bg-accent-error/10' },
  goal: { icon: Target, color: 'text-accent-success', bg: 'bg-accent-success/10' },
  streak: { icon: Flame, color: 'text-accent-warning', bg: 'bg-accent-warning/10' },
  achievement: { icon: Trophy, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
};

export function Notifications() {
  const { data, markNotificationRead, markAllNotificationsRead, clearNotifications } = useAppData();
  const { showToast } = useToast();

  const unreadCount = data.notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-text-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {data.notifications.length > 0 && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { markAllNotificationsRead(); showToast('All marked as read', 'info'); }}>
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { clearNotifications(); showToast('Notifications cleared', 'info'); }}>
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </div>
        )}
      </div>

      {data.notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="No notifications"
          description="You'll see updates about sessions, deadlines, goals, and achievements here."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {data.notifications.map((notif, i) => {
              const config = typeConfig[notif.type];
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className={`p-4 ${!notif.read ? 'border-brand-blue/30' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <config.icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-text-primary">{notif.title}</h3>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-text-secondary mt-0.5">{notif.message}</p>
                        <p className="text-xs text-text-muted mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
