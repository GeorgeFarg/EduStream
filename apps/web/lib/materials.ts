import { FileItem, FileType, Week } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiMaterial {
  id: number;
  title: string;
  category: string;
  fileUrl: string;
  uploadedBy: number;
  classId: number;
  createdAt?: string;
  teacher?: { id: number; name: string };
}

export interface CreateMaterialPayload {
  title: string;
  category: string;
  classId: number;
  file: File;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? body?.error ?? message;
    } catch {}
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function mapCategoryToFileType(category: string): FileType {
  const map: Record<string, FileType> = {
    pdf: "pdf",
    doc: "doc",
    docx: "doc",
    video: "video",
    mp4: "video",
    ppt: "ppt",
    pptx: "ppt",
    zip: "zip",
    link: "link",
  };
  return map[category.toLowerCase()] ?? "link";
}

export function mapApiMaterialToFileItem(m: ApiMaterial): FileItem {
  return {
    id: String(m.id),
    name: m.title,
    type: mapCategoryToFileType(m.category),
    size: "—",
    uploadDate: m.createdAt
      ? new Date(m.createdAt).toLocaleDateString()
      : "Unknown",
    url: `${BASE_URL}${m.fileUrl}`,
  };
}

// ─── هنجمع كل المواد في Week واحدة لكل category ─────────────────────────────

export function groupMaterialsIntoWeeks(materials: ApiMaterial[]): Week[] {
  const weekMap: Record<string, Week> = {};

  materials.forEach((m) => {
    const category = m.category ?? "General";
    if (!weekMap[category]) {
      weekMap[category] = {
        id: category,
        title: category.charAt(0).toUpperCase() + category.slice(1),
        folders: [],
        files: [],
      };
    }
    weekMap[category].files.push(mapApiMaterialToFileItem(m));
  });

  return Object.values(weekMap);
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getMaterials(classId: number): Promise<ApiMaterial[]> {
  const res = await fetch(`${BASE_URL}/api/materials?classId=${classId}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<ApiMaterial[]>(res);
}

export async function getMaterialsByCategory(
  classId: number,
  category: string
): Promise<ApiMaterial[]> {
  const res = await fetch(
    `${BASE_URL}/api/materials?classId=${classId}&category=${category}`,
    { method: "GET", credentials: "include" }
  );
  return handleResponse<ApiMaterial[]>(res);
}

export async function createMaterial(
  payload: CreateMaterialPayload
): Promise<ApiMaterial> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("category", payload.category);
  formData.append("classId", String(payload.classId));
  formData.append("file", payload.file);

  const res = await fetch(`${BASE_URL}/api/materials`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse<ApiMaterial>(res);
}
export async function deleteMaterial(materialId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/materials/${materialId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete material');
}

export async function renameMaterial(
  materialId: number,
  title: string
): Promise<ApiMaterial> {
  const res = await fetch(`${BASE_URL}/api/materials/${materialId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return handleResponse<ApiMaterial>(res);
}