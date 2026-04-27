export type FileType = "pdf" | "doc" | "video" | "ppt" | "zip" | "link";

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  files: FileItem[];
  title?: string;
 folders: Folder[];
}

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: string;
  uploadDate: string;
  url?: string;
}

export type AssignmentStatus = "pending" | "missing" | "submitted";

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status?: AssignmentStatus;
  teacherName: string;
}

export interface Week {
  id: string;
  title: string;
  folders: Folder[];
  files: FileItem[];
}
export interface MaterialFile {
  id: string;
  name: string;
  size: number;
  type: FileType;
  week: number;
  url: string;
}
export interface MaterialFolder {
  id: string
  name: string
  files: FileItem[]
  createdAt: string
}
// types/index.ts  (أضف fileUrl إذا لم يكن موجوداً)

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  teacherName: string;
  fileUrl?: string;
}