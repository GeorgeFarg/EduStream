// lib/api/assignments.ts

import { Assignment } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiAssignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  fileUrl: string | null;
  classId: number;
  teacherId: number;
  teacher?: {
    id: number;
    name: string;
  };
}

export interface CreateAssignmentPayload {
  title: string;
  description: string;
  dueDate: string;
  classId: number;
  file?: File | null;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

export function mapApiAssignment(a: ApiAssignment): Assignment {
  return {
    id: String(a.id),
    title: a.title,
    description: a.description ?? "",
    dueDate: a.dueDate,
    teacherName: a.teacher?.name ?? "Unknown Teacher",
    fileUrl: a.fileUrl ?? undefined,
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? body?.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAssignments(classId: number): Promise<Assignment[]> {
  const res = await fetch(`${BASE_URL}/api/assignments?classId=${classId}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await handleResponse<ApiAssignment[]>(res);
  return data.map(mapApiAssignment);
}

export async function getAssignmentById(id: number): Promise<Assignment> {
  const res = await fetch(`${BASE_URL}/api/assignments/${id}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await handleResponse<ApiAssignment>(res);
  return mapApiAssignment(data);
}

export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<Assignment> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("dueDate", payload.dueDate);
  formData.append("classId", String(payload.classId));
  if (payload.file) {
    formData.append("file", payload.file);
  }

  const res = await fetch(`${BASE_URL}/api/assignments`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await handleResponse<ApiAssignment>(res);
  return mapApiAssignment(data);
}
export async function submitAssignment(
  assignmentId: string,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${BASE_URL}/api/assignments/${assignmentId}/submit`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );

  await handleResponse<unknown>(res);
}
export interface ApiSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  fileUrl: string;
  grade: number | null;
  submittedAt: string;
}

export async function getMySubmissions(): Promise<ApiSubmission[]> {
  const res = await fetch(`${BASE_URL}/api/submissions/my-submissions`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse<ApiSubmission[]>(res);
}
export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/assignments/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  await handleResponse<unknown>(res);
}

export async function updateAssignment(
  id: string,
  data: { title: string; description: string; dueDate: string }
): Promise<Assignment> {
  const res = await fetch(`${BASE_URL}/api/assignments/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<ApiAssignment>(res);
  return mapApiAssignment(result);
}