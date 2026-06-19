import { AlertCircle, Award, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

import type { ClassworkStatus } from '@/components/classwork/types';

export const statusConfig: Record<
  ClassworkStatus,
  {
    label: string;
    color: string;
    icon: typeof Clock;
  }
> = {
  assigned: {
    label: 'Assigned',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Clock,
  },
  graded: {
    label: 'Graded',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Award,
  },
  missing: {
    label: 'Missing',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: AlertCircle,
  },
  returned: {
    label: 'Returned',
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    icon: RotateCcw,
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-green-500/10 text-green-400 border-green-500/20',
    icon: CheckCircle2,
  },
};

export function formatDueDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDaysRemaining(value: string) {
  const dueDate = new Date(value).getTime();
  const now = Date.now();
  const diff = dueDate - now;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
