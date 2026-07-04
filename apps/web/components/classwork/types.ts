export type ClassworkStatus = 'assigned' | 'submitted' | 'graded' | 'missing' | 'returned';
export type ClassworkUserRole = 'student' | 'teacher' | 'admin';

export interface ClassworkAttachment {
  id: string;
  name: string;
  sizeLabel: string;
  url?: string;
}

export interface ClassworkSubmission {
  id?: number;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  files?: File[];
  submittedAt: string;
  isLate?: boolean;
}

export interface TeacherSubmissionEntry {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  isLate: boolean;
  grade: number | null;
}

export interface ClassworkItemData {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: ClassworkStatus;
  points: number;
  attachments: ClassworkAttachment[];
  grade?: number;
  feedback?: string;
  submission?: ClassworkSubmission;
}
