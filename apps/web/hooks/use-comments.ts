'use client';

import { useCallback, useState } from 'react';

import type { StreamAuthor, StreamComment } from '@/components/stream/types';

interface UseCommentsOptions {
  initialComments: StreamComment[];
  currentUser: StreamAuthor;
}

export function useComments({ initialComments, currentUser }: UseCommentsOptions) {
  const [comments, setComments] = useState(initialComments);

  const addComment = useCallback(
    (content: string) => {
      const value = content.trim();

      if (!value) {
        return;
      }

      const nextComment: StreamComment = {
        id: `comment-${Date.now()}`,
        author: currentUser,
        content: value,
        timestamp: 'Just now',
      };

      setComments((current) => [...current, nextComment]);
    },
    [currentUser]
  );

  return {
    comments,
    commentCount: comments.length,
    addComment,
  };
}
