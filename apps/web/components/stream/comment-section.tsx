'use client';

import { CommentInput } from '@/components/stream/comment-input';
import { CommentItem } from '@/components/stream/comment-item';

import type { StreamAuthor, StreamComment } from '@/components/stream/types';

interface CommentSectionProps {
  comments: StreamComment[];
  currentUser: StreamAuthor;
  onAddComment: (content: string) => void;
}

export function CommentSection({ comments, currentUser, onAddComment }: CommentSectionProps) {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <CommentInput currentUser={currentUser} onSubmit={onAddComment} />

      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
