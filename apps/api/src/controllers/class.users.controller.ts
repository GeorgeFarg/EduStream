import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

// GET /api/classes/users?classId=1&ids=1,2,3
// Returns users only if they are members of the given class
export async function getUsersByIds(req: Request, res: Response, next: NextFunction) {
  try {
    const idsRaw = String(req.query.ids || '').trim();
    const classIdRaw = String(req.query.classId || '').trim();

    if (!classIdRaw) {
      return res.status(400).json({ error: { message: 'classId query is required' } });
    }
    const classId = Number(classIdRaw);
    if (Number.isNaN(classId)) {
      return res.status(400).json({ error: { message: 'Invalid classId' } });
    }

    if (!idsRaw) {
      return res.status(400).json({ error: { message: 'ids query is required' } });
    }

    const ids = idsRaw
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((n) => !Number.isNaN(n));

    if (ids.length === 0) {
      return res.status(400).json({ error: { message: 'No valid ids provided' } });
    }

    // Don't rely on Prisma relation field name guesses.
    // Use classMembership table to guarantee correct filtering.
    const memberships = await prisma.classMembership.findMany({
      where: {
        classId,
        userId: { in: ids },
      },
      select: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const users = memberships.map((m) => m.user);


    return res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}


