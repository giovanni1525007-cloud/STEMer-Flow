import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Clock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState } from '@/components/ui/EmptyState';
import { pomodoroService } from '@/services/pomodoroService';
import { useState } from 'react';
import { AddSessionModal } from '@/components/sessions/AddSessionModal';

export function Subjects() {
  const { data } = useAppData();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Subjects</h1>
          <p className="text-text-muted mt-1">Manage your study subjects and track progress.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Session
        </Button>
      </div>

      {data.subjects.length === 0 ? (
        <EmptyState
          icon={<Plus className="w-8 h-8" />}
          title="No subjects yet"
          description="Complete onboarding or add subjects to start tracking your study sessions."
          action={{ label: 'Add Your First Session', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.subjects.map((subject, i) => {
            const sessions = data.sessions.filter((s) => s.subjectId === subject.id);
            const completed = sessions.filter((s) => s.completed).length;
            const total = sessions.length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            const totalTime = sessions.reduce((sum, s) => sum + s.focusTimeSpent, 0);
            const Icon = (LucideIcons as any)[subject.icon] || LucideIcons.BookOpen;

            return (
              <Card
                key={subject.id}
                hover
                delay={i * 0.05}
                onClick={() => navigate(`/app/subjects/${subject.id}`)}
                className="p-5"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${subject.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: subject.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">{subject.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{completed} / {total} Sessions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Progress</span>
                    <span className="font-medium text-text-primary">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-text-muted">
                  <Clock className="w-3.5 h-3.5" />
                  {pomodoroService.formatDuration(totalTime)} total
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddSessionModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
