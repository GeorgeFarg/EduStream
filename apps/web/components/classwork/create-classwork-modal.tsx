'use client';

import { useId, useMemo, useState, type ChangeEvent } from 'react';
import { FileText, X } from 'lucide-react';

import type { ClassworkAttachment } from '@/components/classwork/types';
import { formatFileSize } from '@/components/classwork/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface CreateClassworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    title: string;
    description: string;
    dueDate: string;
    attachments: ClassworkAttachment[];
  }) => void;
}

export function CreateClassworkModal({
  open,
  onOpenChange,
  onCreate,
}: CreateClassworkModalProps) {
  const inputId = useId();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    dueDate?: string;
  }>({});

  const attachmentDrafts = useMemo<ClassworkAttachment[]>(
    () =>
      files.map((file, index) => ({
        id: `attachment-${index}-${file.name}`,
        name: file.name,
        sizeLabel: formatFileSize(file.size),
      })),
    [files]
  );

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setFiles([]);
    setErrors({});
  };

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (!dueDate) {
      nextErrors.dueDate = 'Due date is required.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files ?? []));
  };

  const handleRemoveFile = (index: number) => {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      attachments: attachmentDrafts,
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Classwork</DialogTitle>
          <DialogDescription>Add a new assignment or material for this course.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="classwork-title">Title</Label>
            <Input
              id="classwork-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="classwork-description">Description</Label>
            <Textarea
              id="classwork-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-32"
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="classwork-due-date">Due date</Label>
            <Input
              id="classwork-due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-invalid={Boolean(errors.dueDate)}
            />
            {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId}>Attachments</Label>
            <Input id={inputId} type="file" multiple onChange={handleFilesChange} />

            {attachmentDrafts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachmentDrafts.map((attachment, index) => (
                  <Badge key={attachment.id} variant="secondary" className="gap-2 px-3 py-1">
                    <FileText className="h-3 w-3" />
                    <span className="max-w-40 truncate">{attachment.name}</span>
                    <span className="text-[10px] text-muted-foreground">{attachment.sizeLabel}</span>
                    <button type="button" onClick={() => handleRemoveFile(index)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Classwork</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
