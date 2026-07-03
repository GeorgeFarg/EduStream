'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import Input from '@/components/ui//Input';
import { cn } from '@/lib/utils';

import type { StreamAuthor } from '@/components/stream/types';

interface CommentInputProps {
  currentUser: StreamAuthor;
  onSubmit: (content: string) => void;
}

export function CommentInput({ currentUser, onSubmit }: CommentInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const nextValue = value.trim();

    if (!nextValue) {
      return;
    }

    onSubmit(nextValue);
    setValue('');
  };

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          currentUser.role === 'teacher' ? 'gradient-primary' : 'gradient-accent'
        )}
      >
        {currentUser.avatar}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Add a comment..."
          className="bg-background"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="sm:self-stretch"
        >
          Comment
        </Button>
      </div>
    </div>
  );
}
