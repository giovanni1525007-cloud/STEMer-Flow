import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Priority } from '@/types';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddTaskModal({ open, onClose }: AddTaskModalProps) {
  const { addSharedTask } = useAppData();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(60);
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setTitle('');
    setHours(0);
    setMinutes(60);
    setPriority('medium');
    setDeadline('');
    setNotes('');
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Task title is required';
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) errs.duration = 'Duration must be greater than 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    addSharedTask({
      title,
      duration: totalMinutes,
      priority,
      deadline: deadline || null,
      notes,
      scheduledDate: null,
    });

    showToast('Task added successfully!', 'success');
    resetForm();
    onClose();
  };

  return (
    <Modal open={open} onClose={() => { resetForm(); onClose(); }} title="Add Shared Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="e.g. Prepare Presentation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Duration</label>
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <Select
                value={hours.toString()}
                onChange={(e) => setHours(parseInt(e.target.value))}
                options={Array.from({ length: 8 }, (_, i) => ({ value: i.toString(), label: `${i}h` }))}
              />
            </div>
            <div className="flex-1">
              <Select
                value={minutes.toString()}
                onChange={(e) => setMinutes(parseInt(e.target.value))}
                options={Array.from({ length: 12 }, (_, i) => ({ value: (i * 5).toString(), label: `${i * 5}m` }))}
              />
            </div>
          </div>
          {errors.duration && <p className="text-xs text-accent-error mt-1">{errors.duration}</p>}
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
        <Input
          label="Deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <Textarea
          label="Notes"
          placeholder="Add any notes about this task..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={() => { resetForm(); onClose(); }}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
