'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Pin } from 'lucide-react';

import { CommentSection } from '@/components/stream/comment-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useComments } from '@/hooks/use-comments';
import { useLike } from '@/hooks/use-like';
import { cn } from '@/lib/utils';

import type { StreamAuthor, StreamPost } from '@/components/stream/types';

interface PostCardProps {
  post: StreamPost;
  currentUser: StreamAuthor;
  onTogglePin: (postId: string) => void;
}

const roleLabel: Record<StreamAuthor['role'], string> = {
  admin: 'Admin',
  student: 'Student',
  teacher: 'Teacher',
};

export function PostCard({ post, currentUser, onTogglePin }: PostCardProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const { isLiked, likeCount, toggleLike } = useLike({
    initialLiked: post.isLiked,
    initialLikeCount: post.likeCount,
  });
  const { comments, commentCount, addComment } = useComments({
    initialComments: post.comments,
    currentUser,
    postId: post.id,
  });

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              post.author.role === 'teacher' ? 'gradient-primary' : 'gradient-accent'
            )}
          >
            {post.author.avatar}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{post.author.name}</h3>
              <Badge variant="outline" className="text-xs">
                {roleLabel[post.author.role]}
              </Badge>
              {post.isPinned && (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{post.timestamp}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            'text-muted-foreground transition-colors hover:text-primary',
            post.isPinned && 'text-primary'
          )}
          onClick={() => onTogglePin(post.id)}
          aria-label={post.isPinned ? 'Unpin post' : 'Pin post'}
        >
          <Pin className={cn('h-4 w-4', post.isPinned && 'fill-current')} />
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">{post.title}</h2>
        <p className="text-foreground text-sm leading-relaxed">{post.content}</p>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{likeCount} likes</span>
            <span>{commentCount} comments</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2 text-muted-foreground transition-all hover:text-primary',
                isLiked && 'text-primary'
              )}
              onClick={toggleLike}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-all duration-200',
                  isLiked && 'scale-110 fill-current'
                )}
              />
              Like
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2 text-muted-foreground hover:text-primary',
                isCommentsOpen && 'text-primary'
              )}
              onClick={() => setIsCommentsOpen((current) => !current)}
            >
              <MessageCircle className="h-4 w-4" />
              Comment
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2 text-muted-foreground hover:text-primary',
                post.isPinned && 'text-primary'
              )}
              onClick={() => onTogglePin(post.id)}
            >
              <Pin className={cn('h-4 w-4', post.isPinned && 'fill-current')} />
              {post.isPinned ? 'Unpin' : 'Pin'}
            </Button>
          </div>
        </div>

        {isCommentsOpen && (
          <CommentSection comments={comments} currentUser={currentUser} onAddComment={addComment} />
        )}
      </div>
    </div>
  );
}
