import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, CheckCircle2, Trash2, Edit, Calendar, Filter } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { pomodoroService } from '@/services/pomodoroService';
import type { SharedTask, Priority } from '@/types';

export function SharedTasks() {
  const { data, completeSharedTask, deleteSharedTask, updateSharedTask } = useAppData();
  const { showToast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editTask, setEditTask] = useState<SharedTask | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    let tasks = data.sharedTasks;
    if (filter === 'pending') tasks = tasks.filter((t) => !t.completed);
    else if (filter === 'completed') tasks = tasks.filter((t) => t.completed);
    return tasks;
  }, [data.sharedTasks, filter]);

  const handleComplete = (task: SharedTask) => {
    const { xpGained, leveledUp } = completeSharedTask(task.id);
    showToast('Task completed!', 'success', xpGained);
    if (leveledUp) showToast('Level Up!', 'xp');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Shared Tasks</h1>
          <p className="text-text-muted mt-1">Independent tasks not tied to any subject.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-text-muted" />
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Tasks' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
          ]}
          className="w-auto"
        />
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Plus className="w-8 h-8" />}
          title="No tasks yet"
          description="Add your first shared task to get organized."
          action={{ label: '+ Add Your First Task', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredTasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className={`p-4 ${task.completed ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium text-text-primary ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      {task.completed && <CheckCircle2 className="w-4 h-4 text-accent-success" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {pomodoroService.formatDuration(task.duration)}
                      </span>
                      <Badge variant={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}>
                        {task.priority}
                      </Badge>
                      {task.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {task.notes && <p className="text-xs text-text-muted mt-2 italic">{task.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!task.completed && (
                      <Button size="sm" variant="success" onClick={() => handleComplete(task)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditTask(task)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(task.id)}>
                      <Trash2 className="w-4 h-4 text-accent-error" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editTask}
        onClose={() => setEditTask(null)}
        onSave={(updates) => {
          if (editTask) {
            updateSharedTask(editTask.id, updates);
            showToast('Task updated', 'success');
            setEditTask(null);
          }
        }}
      />

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Task" size="sm">
        <p className="text-sm text-text-secondary mb-6">Are you sure you want to delete this task?</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => {
            if (deleteId) { deleteSharedTask(deleteId); showToast('Task deleted', 'info'); setDeleteId(null); }
          }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

interface EditTaskModalProps {
  task: SharedTask | null;
  onClose: () => void;
  onSave: (updates: Partial<SharedTask>) => void;
}

function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(60);
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  useMemo(() => {
    if (task) {
      setTitle(task.title);
      setHours(Math.floor(task.duration / 60));
      setMinutes(task.duration % 60);
      setPriority(task.priority);
      setDeadline(task.deadline || '');
      setNotes(task.notes);
    }
  }, [task]);

  if (!task) return null;

  return (
    <Modal open={!!task} onClose={onClose} title="Edit Task" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, duration: hours * 60 + minutes, priority, deadline: deadline || null, notes });
        }}
        className="space-y-4"
      >
        <Input label="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Duration</label>
          <div className="flex gap-3">
            <Select value={hours.toString()} onChange={(e) => setHours(parseInt(e.target.value))} options={Array.from({ length: 8 }, (_, i) => ({ value: i.toString(), label: `${i}h` }))} />
            <Select value={minutes.toString()} onChange={(e) => setMinutes(parseInt(e.target.value))} options={Array.from({ length: 12 }, (_, i) => ({ value: (i * 5).toString(), label: `${i * 5}m` }))} />
          </div>
        </div>
        <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
        <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
