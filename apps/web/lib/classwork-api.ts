import { apiBaseUrl } from '@/config/env';
import type {
  ClassworkItemData,
  ClassworkStatus,
  ClassworkSubmission,
  TeacherSubmissionEntry,
} from '@/components/classwork/types';

export interface ApiAssignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  classId: number;
  fileUrl: string | null;
  teacher: { id: number; name: string; email: string };
}

export interface ApiStudentSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  fileUrl: string;
  submittedAt: string;
  isLate: boolean;
  grade: number | null;
  assignment: {
    id: number;
    title: string;
    classId?: number;
  };
}

export interface ApiTeacherSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  fileUrl: string;
  submittedAt: string;
  isLate: boolean;
  grade: number | null;
  student: { id: number; name: string; email: string };
}

export function resolveUploadUrl(fileUrl: string): string {
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${apiBaseUrl}${fileUrl}`;
}

export function getFileNameFromUrl(fileUrl: string): string {
  const filename = fileUrl.split('/').pop() ?? 'Submitted file';
  const withoutTimestamp = filename.replace(/^\d+-/, '');
  return withoutTimestamp || filename;
}

export function formatSubmittedAt(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getAssignmentStatus(
  dueDate: string,
  submission?: Pick<ApiStudentSubmission, 'grade'> | null,
): ClassworkStatus {
  if (submission) {
    return submission.grade !== null && submission.grade !== undefined ? 'graded' : 'submitted';
  }
  return new Date(dueDate) < new Date() ? 'missing' : 'assigned';
}

export function mapApiSubmissionToClassworkSubmission(
  submission: ApiStudentSubmission,
): ClassworkSubmission {
  return {
    id: submission.id,
    fileUrl: submission.fileUrl,
    fileName: getFileNameFromUrl(submission.fileUrl),
    submittedAt: formatSubmittedAt(submission.submittedAt),
    isLate: submission.isLate,
  };
}

export function mapApiTeacherSubmission(
  submission: ApiTeacherSubmission,
): TeacherSubmissionEntry {
  return {
    id: submission.id,
    studentId: submission.studentId,
    studentName: submission.student.name,
    studentEmail: submission.student.email,
    fileUrl: submission.fileUrl,
    fileName: getFileNameFromUrl(submission.fileUrl),
    submittedAt: formatSubmittedAt(submission.submittedAt),
    isLate: submission.isLate,
    grade: submission.grade,
  };
}

export function mapApiAssignmentToClassworkItem(
  assignment: ApiAssignment,
  submission?: ApiStudentSubmission | null,
): ClassworkItemData {
  const classworkSubmission = submission
    ? mapApiSubmissionToClassworkSubmission(submission)
    : undefined;

  return {
    id: String(assignment.id),
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.dueDate,
    status: getAssignmentStatus(assignment.dueDate, submission),
    points: 100,
    grade: submission?.grade ?? undefined,
    attachments: assignment.fileUrl
      ? [
          {
            id: `${assignment.id}-file`,
            name: getFileNameFromUrl(assignment.fileUrl),
            sizeLabel: '',
            url: assignment.fileUrl,
          },
        ]
      : [],
    submission: classworkSubmission,
  };
}

export async function fetchClassAssignments(classId: number): Promise<ApiAssignment[]> {
  const res = await fetch(`${apiBaseUrl}/api/assignments?classId=${classId}`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchMySubmissions(): Promise<ApiStudentSubmission[]> {
  const res = await fetch(`${apiBaseUrl}/api/submissions/my-submissions`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchAssignmentSubmissions(
  assignmentId: string,
): Promise<TeacherSubmissionEntry[]> {
  const res = await fetch(`${apiBaseUrl}/api/assignments/${assignmentId}/submissions`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const data: ApiTeacherSubmission[] = await res.json();
  return (Array.isArray(data) ? data : []).map(mapApiTeacherSubmission);
}

export async function submitAssignmentWork(
  assignmentId: string,
  file: File,
): Promise<{ ok: true; submission: ClassworkSubmission } | { ok: false; message: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${apiBaseUrl}/api/assignments/${assignmentId}/submit`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      message: data?.error?.message ?? 'Failed to submit assignment',
    };
  }

  return {
    ok: true,
    submission: {
      id: data.id,
      fileUrl: data.fileUrl,
      fileName: getFileNameFromUrl(data.fileUrl),
      submittedAt: formatSubmittedAt(data.submittedAt),
      isLate: data.isLate,
    },
  };
}

export async function gradeSubmissionWork(
  submissionId: number,
  grade: number,
): Promise<{ ok: true; grade: number } | { ok: false; message: string }> {
  const res = await fetch(`${apiBaseUrl}/api/submissions/${submissionId}/grade`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grade }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      message: data?.error?.message ?? 'Failed to grade submission',
    };
  }

  return { ok: true, grade: data.grade };
}
