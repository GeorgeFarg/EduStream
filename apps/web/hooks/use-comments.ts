'use client';

import { useCallback, useState } from 'react';
import { apiBaseUrl } from '@/config/env';
import toast from 'react-hot-toast';

import type { StreamAuthor, StreamComment } from '@/components/stream/types';

interface UseCommentsOptions {
  initialComments: StreamComment[];
  currentUser: StreamAuthor;
  postId: string;
}

export function useComments({ initialComments, currentUser, postId }: UseCommentsOptions) {
  const [comments, setComments] = useState(initialComments);

  const addComment = useCallback(
    async (content: string) => {
      const value = content.trim();

      if (!value) {
        return;
      }

      try {
        const res = await fetch(`${apiBaseUrl}/api/announcements/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: value }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data?.error?.message ?? 'Failed to add comment');
          return;
        }

        const nextComment: StreamComment = {
          id: String(data.id),
          author: currentUser,
          content: data.content,
          timestamp: 'Just now',
        };

        setComments((current) => [...current, nextComment]);
        toast.success('Comment added');
      } catch (err) {
        toast.error('Network error adding comment');
      }
    },
    [currentUser, postId]
  );

  return {
    comments,
    commentCount: comments.length,
    addComment,
  };
}
