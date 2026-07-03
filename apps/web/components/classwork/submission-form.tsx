'use client';

import { useId, useState, type ChangeEvent } from 'react';
import { FileText, Upload, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui//Input';
import { Textarea } from '@/components/ui/textarea';
import { formatFileSize } from '@/components/classwork/utils';

import type { ClassworkItemData } from '@/components/classwork/types';

interface SubmissionFormProps {
  assignment: ClassworkItemData;
  allowResubmission?: boolean;
  onSubmit: (payload: { text: string; files: File[] }) => void;
}

export function SubmissionForm({
  assignment,
  allowResubmission = false,
  onSubmit,
}: SubmissionFormProps) {
  const inputId = useId();
  const [text, setText] = useState(assignment.submission?.text ?? '');
  const [files, setFiles] = useState<File[]>(assignment.submission?.files ?? []);

  const isLocked = Boolean(assignment.submission) && !allowResubmission;

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    setFiles((current) => [...current, ...nextFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = () => {
    const payload = { text: text.trim(), files };

    if (!payload.text && payload.files.length === 0) {
      return;
    }

    onSubmit(payload);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Add your answer or notes..."
        className="min-h-28 bg-background transition-all"
        disabled={isLocked}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <Input
            id={inputId}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesChange}
            disabled={isLocked}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 self-start"
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={isLocked}
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <Badge key={`${file.name}-${index}`} variant="secondary" className="gap-2 px-3 py-1">
                  <FileText className="h-3 w-3" />
                  <span className="max-w-40 truncate">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                  {!isLocked && (
                    <button type="button" onClick={() => handleRemoveFile(index)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={isLocked || (!text.trim() && files.length === 0)}
        >
          {assignment.submission && allowResubmission ? 'Resubmit Work' : 'Submit Work'}
        </Button>
      </div>

      {isLocked && (
        <p className="text-sm text-muted-foreground">
          This assignment has already been submitted.
        </p>
      )}
    </div>
  );
}
