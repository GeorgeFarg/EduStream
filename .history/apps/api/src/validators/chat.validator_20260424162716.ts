import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
