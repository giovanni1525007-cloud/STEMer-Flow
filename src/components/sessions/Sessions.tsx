import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, CheckCircle2, Trash2, Edit, Timer, Calendar, Scissors, Filter, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddSessionModal } from '@/components/sessions/AddSessionModal';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { pomodoroService } from '@/services/pomodoroService';
import { getSubjectsForGrade, type StudySession, type Subject } from '@/types';

export function Sessions() {
  const { data, addSession, completeSession, deleteSession } = useAppData();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const availableSubjects: Subject[] = getSubjectsForGrade(user?.grade || 'Grade 10').map((subject) => {
    const savedSubject = data.subjects.find((saved) => saved.name === subject.name);
    return savedSubject || {
      ...subject,
      id: `grade-${user?.grade || 'Grade 10'}-${subject.name.toLowerCase().replace(/\\s+/g, '-')}`,
      totalSessions: 0,
      createdAt: new Date(0).toISOString(),
    };
  });

  const filteredSessions = useMemo(() => {
    let sessions = data.sessions;
    if (filter === 'pending') sessions = sessions.filter((s) => !s.completed);
    else if (filter === 'completed') sessions = sessions.filter((s) => s.completed);
    if (subjectFilter !== 'all') sessions = sessions.filter((s) => s.subjectId === subjectFilter);
    return sessions;
  }, [data.sessions, filter, subjectFilter]);

  const handleComplete = (session: StudySession) => {
    const { xpGained, leveledUp } = completeSession(session.id, session.duration);
    showToast('Session completed!', 'success', xpGained);
    if (leveledUp) showToast('Level Up!', 'xp');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Study Sessions</h1>
          <p className="text-text-muted mt-1">All your study sessions across subjects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Session
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Sessions' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
            ]}
            className="w-auto"
          />
        </div>
        <Select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Subjects' },
            ...availableSubjects.map((s) => ({ value: s.id, label: s.name })),
          ]}
          className="w-auto"
        />
      </div>

      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-8 h-8" />}
          title="No sessions yet"
          description="Your study journey starts with one session."
          action={{ label: '+ Add Your First Session', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session, i) => {
            const subject = availableSubjects.find((s) => s.id === session.subjectId);
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`p-4 ${session.completed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject?.color || '#3b82f6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium text-text-primary ${session.completed ? 'line-through' : ''}`}>
                          {session.title}
                        </h3>
                        {session.completed && <CheckCircle2 className="w-4 h-4 text-accent-success" />}
                      </div>
                      <p className="text-xs text-text-muted mb-2">{session.subjectName}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {pomodoroService.formatDuration(session.duration)}
                        </span>
                        <Badge variant={session.priority === 'high' ? 'error' : session.priority === 'medium' ? 'warning' : 'default'}>
                          {session.priority}
                        </Badge>
                        {session.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(session.deadline).toLocaleDateString()}
                          </span>
                        )}
                        {session.allowSplitting && (
                          <span className="flex items-center gap-1">
                            <Scissors className="w-3.5 h-3.5" />
                            Splittable
                          </span>
                        )}
                      </div>
                      {session.notes && <p className="text-xs text-text-muted mt-2 italic">{session.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {!session.completed && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => navigate('/app/focus')}>
                            <Timer className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="success" onClick={() => handleComplete(session)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => navigate('/app/sessions')}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { deleteSession(session.id); showToast('Session deleted', 'info'); }}>
                        <Trash2 className="w-4 h-4 text-accent-error" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddSessionModal open={addOpen} onClose={() => setAddOpen(false)} />

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        type="sessions"
        availableSubjects={availableSubjects}
        onImport={(rows) => {
          rows.forEach((row) => {
            const subject = availableSubjects.find((s) => s.name === row.subjectName);
            addSession({
              subjectId: subject?.id || '',
              subjectName: row.subjectName || '',
              title: row.title,
              duration: row.duration,
              priority: row.priority,
              deadline: row.deadline,
              notes: row.notes,
              allowSplitting: row.allowSplitting || false,
              scheduledDate: null,
            });
          });
        }}
      />
    </div>
  );
}
