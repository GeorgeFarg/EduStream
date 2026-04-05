import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ClassRole } from '../generated/prisma/client';

export const isTeacherInClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.userId;
    // Check params or body for classId
    const classId = Number(req.params.classId || req.body.classId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    const membership = await prisma.classMembership.findUnique({
      where: {
        userId_classId: {
          userId,
          classId,
        },
      },
    });

    if (!membership || membership.role !== ClassRole.TEACHER) {
      return res.status(403).json({ error: 'Access denied: Teachers only' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const isMemberOfClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const classId = Number(req.query.classId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    const membership = await prisma.classMembership.findUnique({
      where: {
        userId_classId: {
          userId,
          classId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this class' });
    }

    next();
  } catch (error) {
    next(error);
  }
};
