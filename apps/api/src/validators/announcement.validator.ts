import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(45, 'Title must not exceed 45 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  classId: z.number().int().positive('Class ID must be a positive integer'),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
