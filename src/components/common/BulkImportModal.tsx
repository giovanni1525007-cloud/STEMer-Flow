import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Download, AlertCircle, CheckCircle2, X, FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { Priority, Subject } from '@/types';

type ImportType = 'sessions' | 'tasks';

interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
}

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  type: ImportType;
  availableSubjects: Subject[];
  onImport: (rows: ParsedDataRow[]) => void;
}

interface ParsedDataRow {
  title: string;
  subjectName?: string;
  duration: number;
  priority: Priority;
  deadline: string | null;
  notes: string;
  allowSplitting?: boolean;
}

const SESSION_COLUMNS = [
  { key: 'title', label: 'Title', required: true, description: 'Session name' },
  { key: 'subject', label: 'Subject', required: true, description: 'Must match an existing subject name' },
  { key: 'duration', label: 'Duration (min)', required: true, description: 'In minutes, e.g. 45' },
  { key: 'priority', label: 'Priority', required: false, description: 'low, medium, or high (default: medium)' },
  { key: 'deadline', label: 'Deadline', required: false, description: 'YYYY-MM-DD' },
  { key: 'notes', label: 'Notes', required: false, description: 'Any extra notes' },
  { key: 'allow_splitting', label: 'Allow Splitting', required: false, description: 'true or false (default: false)' },
];

const TASK_COLUMNS = [
  { key: 'title', label: 'Title', required: true, description: 'Task title' },
  { key: 'duration', label: 'Duration (min)', required: true, description: 'In minutes, e.g. 60' },
  { key: 'priority', label: 'Priority', required: false, description: 'low, medium, or high (default: medium)' },
  { key: 'deadline', label: 'Deadline', required: false, description: 'YYYY-MM-DD' },
  { key: 'notes', label: 'Notes', required: false, description: 'Any extra notes' },
];

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) rows.push(currentRow);
  }

  return rows;
}

function validateAndParseRows(
  csvRows: string[][],
  type: ImportType,
  subjectNames: string[]
): { valid: ParsedDataRow[]; errors: ParsedRow[]; totalRows: number } {
  if (csvRows.length < 2) {
    return { valid: [], errors: [], totalRows: 0 };
  }

  const columns = type === 'sessions' ? SESSION_COLUMNS : TASK_COLUMNS;
  const headerRow = csvRows[0].map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const colIndexMap: Record<string, number> = {};

  columns.forEach((col) => {
    const idx = headerRow.indexOf(col.key);
    if (idx !== -1) colIndexMap[col.key] = idx;
  });

  const missingRequired = columns.filter((c) => c.required && !(c.key in colIndexMap));
  if (missingRequired.length > 0) {
    return {
      valid: [],
      errors: missingRequired.map((c) => ({
        rowIndex: 0,
        data: {},
        errors: [`Missing required column: ${c.label}`],
      })),
      totalRows: csvRows.length - 1,
    };
  }

  const valid: ParsedDataRow[] = [];
  const errors: ParsedRow[] = [];

  for (let i = 1; i < csvRows.length; i++) {
    const row = csvRows[i];
    const rowData: Record<string, string> = {};
    const rowErrors: string[] = [];

    Object.entries(colIndexMap).forEach(([key, idx]) => {
      rowData[key] = row[idx] || '';
    });

    const title = rowData.title || '';
    if (!title.trim()) rowErrors.push('Title is required');

    const durationStr = rowData.duration || '';
    const duration = parseInt(durationStr, 10);
    if (!durationStr.trim() || isNaN(duration) || duration <= 0) {
      rowErrors.push('Duration must be a positive number');
    }

    let priority: Priority = 'medium';
    const priorityStr = (rowData.priority || '').toLowerCase().trim();
    if (priorityStr && !['low', 'medium', 'high'].includes(priorityStr)) {
      rowErrors.push(`Priority must be low, medium, or high (got "${priorityStr}")`);
    } else if (priorityStr) {
      priority = priorityStr as Priority;
    }

    let deadline: string | null = null;
    const deadlineStr = (rowData.deadline || '').trim();
    if (deadlineStr) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr)) {
        rowErrors.push('Deadline must be YYYY-MM-DD format');
      } else {
        const parsed = new Date(deadlineStr);
        if (isNaN(parsed.getTime())) {
          rowErrors.push('Invalid deadline date');
        } else {
          deadline = deadlineStr;
        }
      }
    }

    const notes = rowData.notes || '';

    if (type === 'sessions') {
      const subjectName = (rowData.subject || '').trim();
      if (!subjectName) {
        rowErrors.push('Subject is required');
      } else if (!subjectNames.includes(subjectName)) {
        rowErrors.push(`Subject "${subjectName}" not found`);
      }

      let allowSplitting = false;
      const splitStr = (rowData.allow_splitting || '').toLowerCase().trim();
      if (splitStr && !['true', 'false'].includes(splitStr)) {
        rowErrors.push('Allow Splitting must be true or false');
      } else if (splitStr === 'true') {
        allowSplitting = true;
      }

      if (rowErrors.length === 0) {
        valid.push({ title, subjectName, duration, priority, deadline, notes, allowSplitting });
      } else {
        errors.push({ rowIndex: i, data: rowData, errors: rowErrors });
      }
    } else {
      if (rowErrors.length === 0) {
        valid.push({ title, duration, priority, deadline, notes });
      } else {
        errors.push({ rowIndex: i, data: rowData, errors: rowErrors });
      }
    }
  }

  return { valid, errors, totalRows: csvRows.length - 1 };
}

function downloadTemplate(type: ImportType) {
  const columns = type === 'sessions' ? SESSION_COLUMNS : TASK_COLUMNS;
  const header = columns.map((c) => c.label).join(',');
  const sampleRow =
    type === 'sessions'
      ? 'Chapter 5 Review,Mathematics,45,high,2025-12-01,Review exercises,false'
      : 'Prepare Presentation,60,medium,2025-12-01,Slides for Monday,';
  const csv = `${header}\n${sampleRow}\n`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = type === 'sessions' ? 'sessions-template.csv' : 'tasks-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkImportModal({ open, onClose, type, availableSubjects, onImport }: BulkImportModalProps) {
  const { showToast } = useToast();
  const [parsedRows, setParsedRows] = useState<ParsedDataRow[]>([]);
  const [errorRows, setErrorRows] = useState<ParsedRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns = type === 'sessions' ? SESSION_COLUMNS : TASK_COLUMNS;
  const subjectNames = availableSubjects.map((s) => s.name);

  const resetState = () => {
    setParsedRows([]);
    setErrorRows([]);
    setTotalRows(0);
    setFileName('');
    setImporting(false);
  };

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        showToast('Please upload a CSV file', 'error');
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const csvRows = parseCSV(text);
        const { valid, errors, totalRows } = validateAndParseRows(csvRows, type, subjectNames);
        setParsedRows(valid);
        setErrorRows(errors);
        setTotalRows(totalRows);

        if (totalRows === 0) {
          showToast('No data rows found in the file', 'error');
        } else if (valid.length === 0 && errors.length > 0) {
          showToast(`All ${errors.length} rows have errors`, 'error');
        } else if (errors.length > 0) {
          showToast(`${valid.length} valid, ${errors.length} with errors`, 'info');
        } else {
          showToast(`${valid.length} rows ready to import`, 'success');
        }
      };
      reader.readAsText(file);
    },
    [type, subjectNames, showToast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    onImport(parsedRows);
    setImporting(false);
    showToast(`Imported ${parsedRows.length} ${type === 'sessions' ? 'sessions' : 'tasks'} successfully!`, 'success');
    resetState();
    onClose();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={type === 'sessions' ? 'Bulk Import Sessions' : 'Bulk Import Tasks'} size="lg">
      <div className="space-y-5">
        {/* Instructions */}
        <div className="rounded-xl bg-bg-secondary p-4 space-y-2">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-brand-blue mt-0.5 flex-shrink-0" />
            <div className="text-sm text-text-secondary">
              <p className="font-medium text-text-primary mb-1">CSV Format</p>
              <p className="text-xs text-text-muted">
                Upload a CSV file with the following columns. Download the template for a ready-to-use example.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {columns.map((col) => (
              <span
                key={col.key}
                className={`text-xs px-2 py-1 rounded-lg ${
                  col.required
                    ? 'bg-brand-blue/15 text-brand-blue font-medium'
                    : 'bg-surface-hover text-text-muted'
                }`}
              >
                {col.label}
                {col.required && ' *'}
              </span>
            ))}
          </div>
          <button
            onClick={() => downloadTemplate(type)}
            className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-brand-blue/80 transition-colors pt-1"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV template
          </button>
        </div>

        {/* Upload area */}
        {parsedRows.length === 0 && errorRows.length === 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer p-10 text-center ${
              isDragging
                ? 'border-brand-blue bg-brand-blue/5'
                : 'border-border-strong hover:border-brand-blue/50 hover:bg-surface-hover'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <motion.div
              animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-blue/10 mb-4"
            >
              <Upload className="w-7 h-7 text-brand-blue" />
            </motion.div>
            <p className="text-sm font-medium text-text-primary">
              {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
            </p>
            <p className="text-xs text-text-muted mt-1">or click to browse</p>
          </div>
        )}

        {/* Results */}
        {(parsedRows.length > 0 || errorRows.length > 0) && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-xl bg-bg-secondary">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary truncate max-w-[200px]">{fileName}</span>
                </div>
                <div className="flex items-center gap-3">
                  {parsedRows.length > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-accent-success font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      {parsedRows.length} valid
                    </span>
                  )}
                  {errorRows.length > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-accent-error font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {errorRows.length} errors
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setParsedRows([]);
                  setErrorRows([]);
                  setTotalRows(0);
                  setFileName('');
                }}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            {/* Valid rows preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Valid Rows Preview</p>
                <div className="overflow-x-auto rounded-xl border border-border max-h-[240px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-bg-secondary z-10">
                      <tr>
                        {columns.map((col) => (
                          <th key={col.key} className="text-left px-3 py-2 font-medium text-text-muted text-xs whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-t border-border hover:bg-surface-hover">
                          <td className="px-3 py-2 text-text-primary max-w-[180px] truncate">{row.title}</td>
                          {type === 'sessions' && (
                            <td className="px-3 py-2 text-text-secondary whitespace-nowrap">{row.subjectName}</td>
                          )}
                          <td className="px-3 py-2 text-text-secondary whitespace-nowrap">{row.duration}m</td>
                          <td className="px-3 py-2 text-text-secondary whitespace-nowrap capitalize">{row.priority}</td>
                          <td className="px-3 py-2 text-text-secondary whitespace-nowrap">{row.deadline || '—'}</td>
                          <td className="px-3 py-2 text-text-muted max-w-[120px] truncate">{row.notes || '—'}</td>
                          {type === 'sessions' && (
                            <td className="px-3 py-2 text-text-secondary whitespace-nowrap">
                              {row.allowSplitting ? 'Yes' : 'No'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 50 && (
                  <p className="text-xs text-text-muted text-center">
                    Showing first 50 of {parsedRows.length} valid rows
                  </p>
                )}
              </div>
            )}

            {/* Error rows */}
            {errorRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-accent-error uppercase tracking-wide">Rows With Errors</p>
                <div className="overflow-x-auto rounded-xl border border-accent-error/30 max-h-[200px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-accent-error/10 z-10">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-text-muted text-xs">Row</th>
                        <th className="text-left px-3 py-2 font-medium text-text-muted text-xs">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorRows.map((err, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 text-text-secondary whitespace-nowrap font-mono text-xs">
                            #{err.rowIndex}
                          </td>
                          <td className="px-3 py-2 text-accent-error text-xs">
                            {err.errors.join('; ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          {parsedRows.length > 0 && (
            <Button className="flex-1" onClick={handleImport} loading={importing}>
              <Upload className="w-4 h-4" />
              Import {parsedRows.length} {type === 'sessions' ? 'Sessions' : 'Tasks'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
