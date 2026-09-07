import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Clock, CheckCircle2, Trash2, Edit, Timer,
  Calendar, Scissors, AlertCircle,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { AddSessionModal } from '@/components/sessions/AddSessionModal';
import { pomodoroService } from '@/services/pomodoroService';
import type { StudySession, Priority } from '@/types';

export function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, updateSession, deleteSession, completeSession } = useAppData();
  const { showToast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editSession, setEditSession] = useState<StudySession | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const subject = data.subjects.find((s) => s.id === id);
  const sessions = useMemo(() => data.sessions.filter((s) => s.subjectId === id), [data.sessions, id]);

  if (!subject) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Subject not found.</p>
        <Button onClick={() => navigate('/app/subjects')} className="mt-4">Back to Subjects</Button>
      </div>
    );
  }

  const Icon = (LucideIcons as any)[subject.icon] || LucideIcons.BookOpen;
  const completed = sessions.filter((s) => s.completed).length;
  const total = sessions.length;
  const remaining = total - completed;
  const totalTime = sessions.reduce((sum, s) => sum + s.focusTimeSpent, 0);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleComplete = (session: StudySession) => {
    const { xpGained, leveledUp } = completeSession(session.id, session.duration);
    showToast('Session completed!', 'success', xpGained);
    if (leveledUp) showToast('Level Up!', 'xp');
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteSession(deleteId);
      showToast('Session deleted', 'info');
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/app/subjects')}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Subjects
      </button>

      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${subject.color}20` }}
          >
            <Icon className="w-8 h-8" style={{ color: subject.color }} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">{subject.name}</h1>
            <p className="text-sm text-text-muted">{completed} / {total} Sessions · {progress}% Complete</p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Session
          </Button>
        </div>
        <ProgressBar value={progress} height="h-3" />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions', value: total.toString(), icon: Clock },
          { label: 'Completed', value: completed.toString(), icon: CheckCircle2 },
          { label: 'Remaining', value: remaining.toString(), icon: AlertCircle },
          { label: 'Total Time', value: pomodoroService.formatDuration(totalTime), icon: Timer },
        ].map((stat, i) => (
          <Card key={stat.label} delay={i * 0.05} className="p-4">
            <stat.icon className="w-5 h-5 text-brand-blue mb-2" />
            <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Sessions list */}
      <div>
        <h2 className="font-semibold text-text-primary mb-4">Sessions</h2>
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title="No sessions yet"
            description="Your study journey starts with one session."
            action={{ label: '+ Add Your First Session', onClick: () => setAddOpen(true) }}
          />
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`p-4 ${session.completed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium text-text-primary ${session.completed ? 'line-through' : ''}`}>
                          {session.title}
                        </h3>
                        {session.completed && <CheckCircle2 className="w-4 h-4 text-accent-success" />}
                      </div>
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
                      {session.notes && (
                        <p className="text-xs text-text-muted mt-2 italic">{session.notes}</p>
                      )}
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
                      <Button size="sm" variant="ghost" onClick={() => setEditSession(session)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(session.id)}>
                        <Trash2 className="w-4 h-4 text-accent-error" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AddSessionModal open={addOpen} onClose={() => setAddOpen(false)} presetSubjectId={subject.id} />

      {/* Edit Modal */}
      <EditSessionModal
        session={editSession}
        onClose={() => setEditSession(null)}
        onSave={(updates) => {
          if (editSession) {
            updateSession(editSession.id, updates);
            showToast('Session updated', 'success');
            setEditSession(null);
          }
        }}
      />

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Session" size="sm">
        <p className="text-sm text-text-secondary mb-6">Are you sure you want to delete this session? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

interface EditSessionModalProps {
  session: StudySession | null;
  onClose: () => void;
  onSave: (updates: Partial<StudySession>) => void;
}

function EditSessionModal({ session, onClose, onSave }: EditSessionModalProps) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [allowSplitting, setAllowSplitting] = useState(false);

  // Sync when session changes
  useMemo(() => {
    if (session) {
      setTitle(session.title);
      setHours(Math.floor(session.duration / 60));
      setMinutes(session.duration % 60);
      setPriority(session.priority);
      setDeadline(session.deadline || '');
      setNotes(session.notes);
      setAllowSplitting(session.allowSplitting);
    }
  }, [session]);

  if (!session) return null;

  return (
    <Modal open={!!session} onClose={onClose} title="Edit Session" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            title,
            duration: hours * 60 + minutes,
            priority,
            deadline: deadline || null,
            notes,
            allowSplitting,
          });
        }}
        className="space-y-4"
      >
        <Input label="Session Name" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Duration</label>
          <div className="flex gap-3">
            <Select
              value={hours.toString()}
              onChange={(e) => setHours(parseInt(e.target.value))}
              options={Array.from({ length: 8 }, (_, i) => ({ value: i.toString(), label: `${i}h` }))}
            />
            <Select
              value={minutes.toString()}
              onChange={(e) => setMinutes(parseInt(e.target.value))}
              options={Array.from({ length: 12 }, (_, i) => ({ value: (i * 5).toString(), label: `${i * 5}m` }))}
            />
          </div>
        </div>
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
        <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-bg-secondary">
          <input type="checkbox" checked={allowSplitting} onChange={(e) => setAllowSplitting(e.target.checked)} className="w-4 h-4 rounded accent-brand-blue" />
          <span className="text-sm text-text-secondary">Allow splitting across multiple days</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
