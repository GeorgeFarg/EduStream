import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(100, 'Title too long'),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

