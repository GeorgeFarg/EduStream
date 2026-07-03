import { z } from 'zod';

export const sendPrivateMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
});

export type SendPrivateMessageInput = z.infer<typeof sendPrivateMessageSchema>;

