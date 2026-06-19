export type MaterialType = 'pdf' | 'image' | 'docx' | 'link' | 'note';
export type MaterialsUserRole = 'student' | 'teacher' | 'admin';

export interface MaterialAttachmentData {
  url?: string;
  previewText?: string;
}

export interface MaterialItemData {
  id: string;
  title: string;
  type: MaterialType;
  description: string;
  uploadedAt: string;
  sourceName?: string;
  externalLink?: string;
  attachment?: MaterialAttachmentData;
}

export interface ChatMaterialContext {
  id: string;
  title: string;
  type: MaterialType;
  description: string;
  uploadedAt: string;
  externalLink?: string;
}
