import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/express';
import { sendMessageSchema } from '../validators/chat.validator';
import * as chatService from '../services/chat.service';
import { prisma } from '../../lib/prisma';
import { ClassRole } from '../generated/prisma/client';

export const getClassMessagesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const classId = Number(req.params.classId);

    if (!classId || isNaN(classId)) {
      return res.status(400).json({
        error: {
          message: 'Valid class ID is required',
          code: 'INVALID_ID',
        },
      });
    }

    const userId = req.user!.id;

    // Verify user is a member of the class
    const membership = await prisma.classMembership.findUnique({
      where: {
        userId_classId: {
          userId,
          classId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        error: {
          message: 'Access denied: You are not a member of this class',
          code: 'FORBIDDEN',
        },
      });
    }

    const messages = await chatService.getMessagesByClass(classId);

    return res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const createMessageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const classId = Number(req.params.classId);

    if (!classId || isNaN(classId)) {
      return res.status(400).json({
        error: {
          message: 'Valid class ID is required',
          code: 'INVALID_ID',
        },
      });
    }

    const validatedData = sendMessageSchema.parse(req.body);
    const senderId = req.user!.id;

    // Verify user is a member of the class
    const membership = await prisma.classMembership.findUnique({
      where: {
        userId_classId: {
          userId: senderId,
          classId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        error: {
          message: 'Access denied: You are not a member of this class',
          code: 'FORBIDDEN',
        },
      });
    }

    const message = await chatService.createMessage({
      content: validatedData.content,
      classId,
      senderId,
    });

    return res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

