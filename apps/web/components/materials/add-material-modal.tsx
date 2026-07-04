'use client';

import { useState, type ChangeEvent } from 'react';
import { FileText, Loader2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { ALLOWED_MATERIAL_EXTENSIONS, isAllowedMaterialFile } from '@/lib/materials-api';
import { formatFileSize } from '@/components/classwork/utils';

interface AddMaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (payload: { title: string; files: File[] }) => Promise<void>;
  uploading?: boolean;
}

export function AddMaterialModal({
  open,
  onOpenChange,
  onAdd,
  uploading = false,
}: AddMaterialModalProps) {
  const [title, setTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<{
    title?: string;
    files?: string;
  }>({});

  const resetForm = () => {
    setTitle('');
    setSelectedFiles([]);
    setErrors({});
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setSelectedFiles((current) => {
      const existingNames = new Set(current.map((file) => file.name));
      const nextFiles = files.filter((file) => !existingNames.has(file.name));
      return [...current, ...nextFiles];
    });

    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!title.trim()) {
      nextErrors.title = 'Title is required.';
    } else if (title.trim().length < 3) {
      nextErrors.title = 'Title must be at least 3 characters.';
    }

    if (selectedFiles.length === 0) {
      nextErrors.files = 'Select at least one file to upload.';
    } else {
      const invalidFile = selectedFiles.find((file) => !isAllowedMaterialFile(file));
      if (invalidFile) {
        nextErrors.files = `"${invalidFile.name}" is not supported. Allowed: PDF, DOCX, PPTX, XLSX, ZIP, JPG, PNG.`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || uploading) {
      return;
    }

    await onAdd({
      title: title.trim(),
      files: selectedFiles,
    });

    resetForm();
    onOpenChange(false);
  };

  const acceptValue = ALLOWED_MATERIAL_EXTENSIONS.join(',');

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (uploading) return;
        onOpenChange(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
          <DialogDescription>
            Upload one or more files for your class. Students will see all uploaded materials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-title">Title</Label>
            <Input
              id="material-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Week 1 Lecture Notes"
              disabled={uploading}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            {selectedFiles.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Each file will use this title with the file name appended.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-file">Files</Label>
            <Input
              id="material-file"
              type="file"
              multiple
              accept={acceptValue}
              onChange={handleFileChange}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Supported: PDF, DOCX, PPTX, XLSX, ZIP, JPG, PNG. You can select multiple files.
            </p>

            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedFiles.map((file, index) => (
                  <Badge key={`${file.name}-${index}`} variant="secondary" className="gap-2 px-3 py-1">
                    <FileText className="h-3 w-3" />
                    <span className="max-w-40 truncate">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}

            {errors.files && <p className="text-sm text-destructive">{errors.files}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || selectedFiles.length === 0}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : selectedFiles.length > 1 ? (
              `Upload ${selectedFiles.length} Materials`
            ) : (
              'Upload Material'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
