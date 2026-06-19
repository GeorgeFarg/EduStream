import { FileImage, FileText, FileType2, Link2, StickyNote } from 'lucide-react';

import type { MaterialType } from '@/components/materials/types';

export const materialTypeConfig: Record<
  MaterialType,
  {
    label: string;
    icon: typeof FileText;
  }
> = {
  docx: {
    label: 'DOCX',
    icon: FileType2,
  },
  image: {
    label: 'Image',
    icon: FileImage,
  },
  link: {
    label: 'Link',
    icon: Link2,
  },
  note: {
    label: 'Note',
    icon: StickyNote,
  },
  pdf: {
    label: 'PDF',
    icon: FileText,
  },
};

export function formatMaterialDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
