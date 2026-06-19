import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/express';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

export const getAnnouncementCommentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const announcementId = Number(req.params.announcementId);

    if (isNaN(announcementId)) {
      return res.status(400).json({ error: { message: 'Invalid announcement ID', code: 'INVALID_ID' } });
    }

    const comments = await prisma.comment.findMany({
      where: { announcementId },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};

export const createCommentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const announcementId = Number(req.params.announcementId);
    const userId = req.user!.id;

    if (isNaN(announcementId)) {
      return res.status(400).json({ error: { message: 'Invalid announcement ID', code: 'INVALID_ID' } });
    }

    const validatedData = commentSchema.parse(req.body);

    // Verify announcement exists and user has access
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      select: { classId: true },
    });

    if (!announcement) {
      return res.status(404).json({ error: { message: 'Announcement not found', code: 'NOT_FOUND' } });
    }

    // Verify user is member of the class
    const membership = await prisma.classMembership.findUnique({
      where: {
        userId_classId: { userId, classId: announcement.classId },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
    }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        announcementId,
        userId,
      },
    });

    // Emit socket event for real-time updates
    const io = (req.app as any).io;
    if (io) {
      io.to(`class:${announcement.classId}`).emit('new-comment', {
        announcementId,
        comment,
      });
    }

    return res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};
