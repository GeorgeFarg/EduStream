import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/express';
import { sendPrivateMessageSchema } from '../validators/privateChat.validator';
import * as privateChatService from '../services/privateChat.service';

export const getConversationsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const conversations = await privateChatService.getConversations(userId);
    return res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
};

export const getMessagesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const otherUserId = Number(req.params.userId);

    if (isNaN(otherUserId)) {
      return res.status(400).json({
        error: { message: 'Invalid user ID', code: 'INVALID_ID' },
      });
    }

    const messages = await privateChatService.getMessagesBetweenUsers(userId, otherUserId);

    // Mark messages from other user as read
    await privateChatService.markMessagesAsRead(userId, otherUserId);

    return res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const sendMessageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = sendPrivateMessageSchema.parse(req.body);
    const senderId = req.user!.id;
    const receiverId = Number(req.params.userId);

    if (isNaN(receiverId)) {
      return res.status(400).json({
        error: { message: 'Invalid user ID', code: 'INVALID_ID' },
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        error: { message: 'Cannot send message to yourself', code: 'SELF_MESSAGE' },
      });
    }

    const message = await privateChatService.sendPrivateMessage({
      content: validatedData.content,
      senderId,
      receiverId,
    });

    return res.status(201).json(message);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.reduce((acc: Record<string, string>, err: any) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          }, {}),
        },
      });
    }
    next(error);
  }
};

export const searchUsersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const query = String(req.query.q || '').trim();

    if (!query || query.length < 1) {
      return res.status(400).json({
        error: { message: 'Search query is required', code: 'INVALID_QUERY' },
      });
    }

    const users = await privateChatService.searchUsers(query, userId);
    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

