'use client';

import { useMemo, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

import { PostCard } from '@/components/stream/post-card';
import { PostForm } from '@/components/stream/post-form';
import { Button } from '@/components/ui/button';
import { apiBaseUrl } from '@/config/env';
import toast from 'react-hot-toast';

import type { StreamAuthor, StreamPost } from '@/components/stream/types';
import type { Classroom } from '@/types/classroom-return.d';

interface StreamFeedProps {
  initialPosts: StreamPost[];
  currentUser: StreamAuthor;
  currentClass: Classroom;
  canPost: boolean;
  isLoading?: boolean;
  onPostCreated: (post: StreamPost) => void;
}

export function StreamFeed({
  initialPosts,
  currentUser,
  currentClass,
  canPost,
  isLoading,
  onPostCreated,
}: StreamFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Keep posts in sync when initialPosts changes (class switch)
  useMemo(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const sortedPosts = useMemo(() => {
    const pinned = posts.filter((p) => p.isPinned);
    const regular = posts.filter((p) => !p.isPinned);
    return [...pinned, ...regular];
  }, [posts]);

  const handleTogglePin = (postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, isPinned: !post.isPinned } : post,
      ),
    );
  };

  const handleCreatePost = async (content: string, title?: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title?.trim() || 'Announcement',
          content: trimmed,
          classId: currentClass.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Failed to post announcement');
        return;
      }

      const newPost: StreamPost = {
        id: String(data.id),
        title: data.title,
        content: data.content,
        author: currentUser,
        timestamp: 'Just now',
        isPinned: false,
        likeCount: 0,
        isLiked: false,
        comments: [],
      };

      setPosts((current) => [newPost, ...current]);
      onPostCreated(newPost);
      setIsComposerOpen(false);
      toast.success('Announcement posted');
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stream</h1>
          <p className="mt-1 text-muted-foreground">{currentClass.name}</p>
        </div>
        {canPost && (
          <Button
            className="gap-2 self-start sm:self-auto"
            size="lg"
            onClick={() => setIsComposerOpen((c) => !c)}
            disabled={submitting}
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>

      {isComposerOpen && canPost && (
        <PostForm currentUser={currentUser} onSubmit={handleCreatePost} submitting={submitting} />
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading announcements...
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No announcements yet.
          {canPost && ' Post the first one!'}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
