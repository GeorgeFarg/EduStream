import { formatDistanceToNow, format } from 'date-fns';

export function getRelativeTime(date: Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: Date, formatStr: string = 'MMM dd, yyyy'): string {
  return format(new Date(date), formatStr);
}

export function formatDateTime(date: Date): string {
  return format(new Date(date), 'MMM dd, yyyy h:mm a');
}

export function getDaysUntil(date: Date): number {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: Date): boolean {
  return new Date(date) < new Date();
}

export function isDueSoon(date: Date, days: number = 3): boolean {
  const daysLeft = getDaysUntil(date);
  return daysLeft <= days && daysLeft > 0;
}
