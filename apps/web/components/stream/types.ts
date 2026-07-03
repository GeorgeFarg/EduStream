export type StreamAuthorRole = 'teacher' | 'student' | 'admin';

export interface StreamAuthor {
  name: string;
  avatar: string;
  role: StreamAuthorRole;
}

export interface StreamComment {
  id: string;
  author: StreamAuthor;
  content: string;
  timestamp: string;
}

export interface StreamPost {
  id: string;
  title: string;
  content: string;
  author: StreamAuthor;
  timestamp: string;
  isPinned: boolean;
  likeCount: number;
  isLiked?: boolean;
  comments: StreamComment[];
}
