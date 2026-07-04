import { apiBaseUrl } from '@/config/env';
import type { MaterialItemData, MaterialType } from '@/components/materials/types';

export interface ApiMaterial {
  id: number;
  title: string;
  fileUrl: string;
  category: string;
  uploadedBy: number;
  uploaderName: string;
  createdAt: string;
}

export const ALLOWED_MATERIAL_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.pptx',
  '.xlsx',
  '.zip',
  '.jpg',
  '.jpeg',
  '.png',
];

export function resolveMaterialUrl(fileUrl: string): string {
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${apiBaseUrl}${fileUrl}`;
}

export function getFileNameFromUrl(fileUrl: string): string {
  const filename = fileUrl.split('/').pop() ?? 'Material file';
  return filename.replace(/^\d+-/, '') || filename;
}

export function categoryFromFile(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  const map: Record<string, string> = {
    pdf: 'PDF',
    docx: 'Document',
    pptx: 'Presentation',
    xlsx: 'Spreadsheet',
    zip: 'Archive',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
  };

  return map[ext] ?? 'Material';
}

export function categoryToType(category: string): MaterialType {
  const lower = category.toLowerCase();
  if (lower.includes('pdf')) return 'pdf';
  if (lower.includes('doc')) return 'docx';
  if (lower.includes('presentation') || lower.includes('ppt')) return 'docx';
  if (lower.includes('spreadsheet') || lower.includes('xlsx')) return 'docx';
  if (lower.includes('image') || lower.includes('img') || lower.includes('png') || lower.includes('jpg')) {
    return 'image';
  }
  if (lower.includes('archive') || lower.includes('zip')) return 'docx';
  return 'pdf';
}

export function isAllowedMaterialFile(file: File): boolean {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  return ALLOWED_MATERIAL_EXTENSIONS.includes(ext);
}

export function mapApiMaterialToItem(material: ApiMaterial): MaterialItemData {
  return {
    id: String(material.id),
    title: material.title,
    type: categoryToType(material.category),
    description: `Uploaded by ${material.uploaderName} · ${material.category}`,
    uploadedAt: material.createdAt,
    sourceName: getFileNameFromUrl(material.fileUrl),
    attachment: {
      url: resolveMaterialUrl(material.fileUrl),
    },
  };
}

export async function fetchClassMaterials(classId: number): Promise<MaterialItemData[]> {
  const res = await fetch(`${apiBaseUrl}/api/materials?classId=${classId}`, {
    credentials: 'include',
  });

  if (!res.ok) return [];

  const data: ApiMaterial[] = await res.json();
  return (Array.isArray(data) ? data : []).map(mapApiMaterialToItem);
}

export async function uploadClassMaterial(
  classId: number,
  file: File,
  title: string,
  category?: string,
): Promise<{ ok: true; material: ApiMaterial } | { ok: false; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('category', category ?? categoryFromFile(file));

  const res = await fetch(`${apiBaseUrl}/api/materials/${classId}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      message: data?.error?.message ?? 'Failed to upload material',
    };
  }

  return { ok: true, material: data as ApiMaterial };
}
