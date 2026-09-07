import { motion } from 'framer-motion';
import { Lock, Trophy } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';

export function Achievements() {
  const { data } = useAppData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Achievements</h1>
        <p className="text-text-muted mt-1">Unlock badges by reaching study milestones.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card delay={0.05} className="p-4 text-center">
          <Trophy className="w-6 h-6 text-accent-warning mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-primary">
            {data.achievements.filter((a) => a.unlocked).length}
          </p>
          <p className="text-xs text-text-muted">Unlocked</p>
        </Card>
        <Card delay={0.1} className="p-4 text-center">
          <Lock className="w-6 h-6 text-text-muted mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-primary">
            {data.achievements.filter((a) => !a.unlocked).length}
          </p>
          <p className="text-xs text-text-muted">Locked</p>
        </Card>
        <Card delay={0.15} className="p-4 text-center">
          <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple" />
          <p className="text-2xl font-bold text-text-primary">
            {Math.round((data.achievements.filter((a) => a.unlocked).length / data.achievements.length) * 100)}%
          </p>
          <p className="text-xs text-text-muted">Complete</p>
        </Card>
      </div>

      {/* Achievement cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.achievements.map((achievement, i) => {
          const Icon = (LucideIcons as any)[achievement.icon] || LucideIcons.Award;
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`p-5 relative overflow-hidden ${
                  achievement.unlocked
                    ? 'border-accent-warning/30 bg-gradient-to-br from-accent-warning/5 to-transparent'
                    : ''
                }`}
              >
                {achievement.unlocked && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-warning/5 rounded-full blur-2xl" />
                )}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-accent-warning to-accent-error shadow-lg shadow-accent-warning/20'
                          : 'bg-bg-tertiary'
                      }`}
                    >
                      {achievement.unlocked ? (
                        <Icon className="w-6 h-6 text-white" />
                      ) : (
                        <Lock className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                    {achievement.unlocked ? (
                      <Badge variant="success">
                        <Trophy className="w-3 h-3" />
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="default">Locked</Badge>
                    )}
                  </div>
                  <h3 className={`font-semibold ${achievement.unlocked ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-text-muted mt-1 mb-3">{achievement.description}</p>
                  {!achievement.unlocked && achievement.progress > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-muted">Progress</span>
                        <span className="font-medium text-text-primary">{achievement.currentValue} / {achievement.threshold}</span>
                      </div>
                      <ProgressBar value={achievement.currentValue} max={achievement.threshold} />
                    </div>
                  )}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-xs text-text-muted">
                      Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
