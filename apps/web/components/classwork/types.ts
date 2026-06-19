export type ClassworkStatus = 'assigned' | 'submitted' | 'graded' | 'missing' | 'returned';
export type ClassworkUserRole = 'student' | 'teacher' | 'admin';

export interface ClassworkAttachment {
  id: string;
  name: string;
  sizeLabel: string;
}

export interface ClassworkSubmission {
  text: string;
  files: File[];
  submittedAt: string;
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
