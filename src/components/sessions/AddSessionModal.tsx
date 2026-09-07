import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getSubjectsForGrade, type Priority, type Subject } from '@/types';

interface AddSessionModalProps {
  open: boolean;
  onClose: () => void;
  presetSubjectId?: string;
}

export function AddSessionModal({ open, onClose, presetSubjectId }: AddSessionModalProps) {
  const { data, addSession } = useAppData();
  const { user } = useAuth();
  const { showToast } = useToast();
  const gradeSubjects = getSubjectsForGrade(user?.grade || 'Grade 10');
  const availableSubjects: Subject[] = gradeSubjects.map((subject) => {
    const savedSubject = data.subjects.find((saved) => saved.name === subject.name);
    return savedSubject || {
      ...subject,
      id: `grade-${user?.grade || 'Grade 10'}-${subject.name.toLowerCase().replace(/\\s+/g, '-')}`,
      totalSessions: 0,
      createdAt: new Date(0).toISOString(),
    };
  });
  const [subjectId, setSubjectId] = useState(presetSubjectId || '');
  const [title, setTitle] = useState('');
  const [durationMode, setDurationMode] = useState<'presets' | 'custom'>('presets');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [customMinutes, setCustomMinutes] = useState(60);
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [allowSplitting, setAllowSplitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setSubjectId(presetSubjectId || '');
    setTitle('');
    setDurationMode('presets');
    setHours(0);
    setMinutes(45);
    setCustomMinutes(60);
    setPriority('medium');
    setDeadline('');
    setNotes('');
    setAllowSplitting(false);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!subjectId) errs.subjectId = 'Please select a subject';
    if (!title.trim()) errs.title = 'Session name is required';
    const totalMinutes = durationMode === 'custom' ? customMinutes : hours * 60 + minutes;
    if (totalMinutes <= 0) errs.duration = 'Duration must be greater than 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const subject = availableSubjects.find((s) => s.id === subjectId);
    if (!subject) return;

    addSession({
      subjectId,
      subjectName: subject.name,
      title,
      duration: totalMinutes,
      priority,
      deadline: deadline || null,
      notes,
      allowSplitting,
      scheduledDate: null,
    });

    showToast('Session added successfully!', 'success');
    resetForm();
    onClose();
  };

  return (
    <Modal open={open} onClose={() => { resetForm(); onClose(); }} title="Add Study Session" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          error={errors.subjectId}
          options={[
            { value: '', label: 'Select a subject...' },
            ...availableSubjects.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <Input
          label="Session Name"
          placeholder="e.g. Chapter 5 Review"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-text-secondary">Duration</label>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-bg-secondary">
              <button
                type="button"
                onClick={() => setDurationMode('presets')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${durationMode === 'presets' ? 'bg-brand-blue text-white' : 'text-text-muted hover:text-text-primary'}`}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setDurationMode('custom')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${durationMode === 'custom' ? 'bg-brand-blue text-white' : 'text-text-muted hover:text-text-primary'}`}
              >
                Custom
              </button>
            </div>
          </div>
          {durationMode === 'presets' ? (
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
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  min={1}
                  value={customMinutes.toString()}
                  onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                  placeholder="Enter minutes"
                />
              </div>
              <span className="text-sm text-text-muted whitespace-nowrap">
                ≈ {Math.floor(customMinutes / 60)}h {customMinutes % 60}m
              </span>
            </div>
          )}
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
          placeholder="Add any notes about this session..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-bg-secondary hover:bg-surface-hover transition-colors">
          <input
            type="checkbox"
            checked={allowSplitting}
            onChange={(e) => setAllowSplitting(e.target.checked)}
            className="w-4 h-4 rounded accent-brand-blue"
          />
          <span className="text-sm text-text-secondary">Allow this session to be split across multiple days</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={() => { resetForm(); onClose(); }}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            <Plus className="w-4 h-4" />
            Add Session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
