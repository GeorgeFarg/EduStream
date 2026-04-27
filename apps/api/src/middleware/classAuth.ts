import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ClassRole } from '../generated/prisma/client';

export const isTeacherInClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // جيب classId من params أو body أو query
    let classId = Number(req.params.classId || req.query.classId);
    console.log("CLASS###################", classId);
    
    // لو مفيش classId، جيبه من الـ assignment عن طريق الـ id
    if (!classId && req.params.id) {
      const assignmentId = parseInt(req.params.id, 10);
      if (!isNaN(assignmentId)) {
        const assignment = await prisma.assignment.findUnique({
          where: { id: assignmentId },
          select: { classId: true },
        });

        if (!assignment) {
          return res.status(404).json({ error: 'Assignment not found' });
        }

        classId = assignment.classId;
      }
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

    req.memperShip = {
      isTeacher: membership.role === "TEACHER",
    };

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
    const userId = (req as any).user?.userId;
    const classId = Number(req.params.classId || req.body.classId || req.query.classId);

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
