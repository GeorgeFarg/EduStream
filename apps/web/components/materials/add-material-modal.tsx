'use client';

import { useMemo, useState, type ChangeEvent } from 'react';

import type { MaterialItemData, MaterialType } from '@/components/materials/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AddMaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (material: Omit<MaterialItemData, 'id' | 'uploadedAt'>) => void;
}

export function AddMaterialModal({ open, onOpenChange, onAdd }: AddMaterialModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    source?: string;
  }>({});

  const materialType = useMemo<MaterialType>(() => {
    if (externalLink.trim()) {
      return 'link';
    }

    if (!selectedFile) {
      return 'note';
    }

    if (
      selectedFile.type === 'text/plain' ||
      selectedFile.type === 'text/markdown' ||
      selectedFile.name.endsWith('.txt') ||
      selectedFile.name.endsWith('.md') ||
      selectedFile.name.endsWith('.mk')
    ) {
      return 'note';
    }

    return selectedFile.type === 'application/pdf' ? 'pdf' : 'image';
  }, [externalLink, selectedFile]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setExternalLink('');
    setSelectedFile(null);
    setErrors({});
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (!selectedFile && !externalLink.trim()) {
      nextErrors.source = 'Add a PDF/image file, or provide an external link.';
    }

    if (selectedFile) {
      const isValidType =
        selectedFile.type === 'application/pdf' ||
        selectedFile.type.startsWith('image/') ||
        selectedFile.type === 'text/plain' ||
        selectedFile.type === 'text/markdown' ||
        selectedFile.name.endsWith('.txt') ||
        selectedFile.name.endsWith('.md') ||
        selectedFile.name.endsWith('.mk');

      if (!isValidType) {
        nextErrors.source = 'Supported files are PDF, image, TXT, MD, and MK.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    const objectUrl = selectedFile ? URL.createObjectURL(selectedFile) : undefined;
    const previewText =
      materialType === 'note' && selectedFile
        ? await selectedFile.text()
        : materialType === 'note'
          ? description.trim()
          : undefined;

    onAdd({
      title: title.trim(),
      description: description.trim(),
      type: materialType,
      sourceName: selectedFile?.name,
      externalLink: externalLink.trim() || undefined,
      attachment: {
        url: objectUrl,
        previewText,
      },
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
          <DialogDescription>Upload a resource or share an external link for your class.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-title">Title</Label>
            <Input
              id="material-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-description">Description</Label>
            <Textarea
              id="material-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-28"
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-file">File upload</Label>
            <Input
              id="material-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.mk,text/plain,text/markdown"
              onChange={handleFileChange}
            />
            {selectedFile && <p className="text-xs text-muted-foreground">{selectedFile.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-link">External link</Label>
            <Input
              id="material-link"
              type="url"
              value={externalLink}
              onChange={(event) => setExternalLink(event.target.value)}
              placeholder="https://example.com/resource"
            />
          </div>

          {errors.source && <p className="text-sm text-destructive">{errors.source}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Material</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
