import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { StreamComment } from '@/components/stream/types';

interface CommentItemProps {
  comment: StreamComment;
}

const roleLabel = {
  admin: 'Admin',
  student: 'Student',
  teacher: 'Teacher',
} as const;

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          comment.author.role === 'teacher' ? 'gradient-primary' : 'gradient-accent'
        )}
      >
        {comment.author.avatar}
      </div>

      <div className="min-w-0 flex-1">
        <div className="rounded-lg bg-muted/70 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{comment.author.name}</p>
            <Badge variant="outline" className="text-[10px] uppercase tracking-normal">
              {roleLabel[comment.author.role]}
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{comment.content}</p>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{comment.timestamp}</p>
      </div>
    </div>
  );
}
