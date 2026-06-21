'use client';

import { useEffect, useState } from 'react';
import { StreamFeed } from '@/components/stream/stream-feed';
import type { StreamAuthor, StreamPost } from '@/components/stream/types';
import { useClassContext } from '@/contexts/ClassContext';
import { apiBaseUrl } from '@/config/env';

interface ApiAnnouncement {
  id: number;
  title: string;
  content: string;
  teacherId: number;
  classId: number;
  createdAt: string;
  teacher: { id: number; name: string; email: string };
  comments?: Array<{
    id: number;
    content: string;
    announcementId: number;
    userId: number;
    createdAt: string;
    user: { id: number; name: string; email: string };
  }>;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

export default function StreamPage() {
  const { currentClass, currentUser, userId, isTeacher, loading } = useClassContext();
  const [posts, setPosts] = useState<StreamPost[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [membership, setMembership] = useState<{ isTeacher: boolean } | null>(null);

  useEffect(() => {
    if (!currentClass) return;
    setFetchLoading(true);

    fetch(`${apiBaseUrl}/api/announcements?classId=${currentClass.id}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { announcements: ApiAnnouncement[]; memperShip: { isTeacher: boolean } }) => {
        setMembership(data.memperShip);
        const mapped: StreamPost[] = (data.announcements ?? []).map((a) => ({
          id: String(a.id),
          title: a.title,
          content: a.content,
          author: {
            name: a.teacher.name,
            avatar: a.teacher.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
            role: 'teacher' as const,
          },
          timestamp: formatTimestamp(a.createdAt),
          isPinned: false,
          likeCount: 0,
          isLiked: false,
          comments: (a.comments ?? []).map((c) => ({
            id: String(c.id),
            author: {
              name: c.user?.name || 'User',
              avatar: (c.user?.name || 'User')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2),
              role: c.userId === a.teacherId ? 'teacher' : 'student',
            },
            content: c.content,
            timestamp: formatTimestamp(c.createdAt),
          })),
        }));
        setPosts(mapped);
      })
      .catch(() => {})
      .finally(() => setFetchLoading(false));
  }, [currentClass?.id]);

  const currentUserAuthor: StreamAuthor = {
    name: currentUser?.name ?? 'You',
    avatar: currentUser?.name
      ? currentUser.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'ME',
    role: currentClass && userId ? (isTeacher(currentClass.id) ? 'teacher' : 'student') : 'student',
  };

  if (loading || !currentClass) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Stream</h1>
        {loading ? (
          <p className="text-muted-foreground">Loading your classes...</p>
        ) : (
          <p className="text-muted-foreground">
            No class selected. Join or create a class using the sidebar.
          </p>
        )}
      </div>
    );
  }

  return (
    <StreamFeed
      initialPosts={posts}
      currentUser={currentUserAuthor}
      currentClass={currentClass}
      canPost={!!membership?.isTeacher}
      isLoading={fetchLoading}
      onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
    />
  );
}
