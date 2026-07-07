import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import type { AuthRequest } from '../types/express';

export const updateMeController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    const { name, email } = req.body as {
      name?: string;
      email?: string;
    };

    const trimmedName = typeof name === 'string' ? name.trim() : undefined;
    const trimmedEmail = typeof email === 'string' ? email.trim() : undefined;

    if (!trimmedName && !trimmedEmail) {
      res.status(400).json({ error: { message: 'Nothing to update' } });
      return;
    }

    // Basic validation
    if (trimmedName !== undefined && !trimmedName) {
      res.status(400).json({ error: { message: 'Name is required' } });
      return;
    }

    if (trimmedEmail !== undefined) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
      if (!emailOk) {
        res.status(400).json({ error: { message: 'Invalid email address' } });
        return;
      }
    }

    // If email changes, ensure uniqueness
    if (trimmedEmail !== undefined) {
      const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
      if (existing && existing.id !== req.user.id) {
        res.status(400).json({ error: { message: 'Email is already in use' } });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(trimmedName !== undefined ? { name: trimmedName } : {}),
        ...(trimmedEmail !== undefined ? { email: trimmedEmail } : {}),
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.status(200).json({ user: updated });
  } catch (error) {
    next(error);
  }
};

