'use client';

import { useId, useState, type ChangeEvent } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { formatFileSize } from '@/components/classwork/utils';

import type { ClassworkItemData } from '@/components/classwork/types';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.zip'];

interface SubmissionFormProps {
  assignment: ClassworkItemData;
  submitting?: boolean;
  onSubmit: (payload: { files: File[] }) => void;
}

export function SubmissionForm({
  assignment,
  submitting = false,
  onSubmit,
}: SubmissionFormProps) {
  const inputId = useId();
  const [files, setFiles] = useState<File[]>([]);

  const isLocked = Boolean(assignment.submission);

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = Array.from(event.target.files ?? [])[0];
    if (!nextFile) return;
    setFiles([nextFile]);
    event.target.value = '';
  };

  const handleRemoveFile = () => {
    setFiles([]);
  };

  const handleSubmit = () => {
    if (files.length === 0) return;
    onSubmit({ files });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload your work as a PDF, DOCX, or ZIP file.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <Input
            id={inputId}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={handleFilesChange}
            disabled={isLocked || submitting}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 self-start"
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={isLocked || submitting}
          >
            <Upload className="h-4 w-4" />
            Choose File
          </Button>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <Badge key={file.name} variant="secondary" className="gap-2 px-3 py-1">
                  <FileText className="h-3 w-3" />
                  <span className="max-w-40 truncate">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                  {!isLocked && !submitting && (
                    <button type="button" onClick={handleRemoveFile} className="hover:text-destructive">
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
          disabled={isLocked || submitting || files.length === 0}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Work'
          )}
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
