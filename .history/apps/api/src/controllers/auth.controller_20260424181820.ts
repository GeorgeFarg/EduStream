import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/express';
import { prisma } from '../../lib/prisma';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { register, login } from '../services/auth.service';
import { ZodError } from 'zod';
import { createSession, SET_CasheSession } from '../services/session.service';
import { redisClient } from '../config/redis';

const DAY_DEFAULT_SESSION_TTL = 60 * 60 * 24; // 7 days
const WEEK_DEFAULT_SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Call auth service
    const result = await register(validatedData);

    // Create a server-side session and set httpOnly cookie
    const { token, expiresAt } = await createSession(result.user.id, WEEK_DEFAULT_SESSION_TTL * 1000);
    // res.cookie('session', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'lax',
    //   expires: expiresAt,
    //   path: '/',
    // });

    await SET_CasheSession(token, { ...result.user }, WEEK_DEFAULT_SESSION_TTL)

    // Return 201 with token, user, and session (so server-side clients e.g. Next.js can set the cookie)
    res.status(201).json({ ...result, token, expiresAt });
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle validation errors
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.reduce((acc: Record<string, string>, err) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          }, {}),
        },
      });
      return;
    }
    // Pass other errors to error handler middleware
    next(error);
  }
};

/**
 * Get current authenticated user
 * @route GET /api/auth/me
 */
export const meController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: { message: 'Authentication required.', code: 'UNAUTHORIZED' },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({
        error: { message: 'User not found.', code: 'NOT_FOUND' },
      });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Login an existing user
 * @route POST /api/auth/login
 */
export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    let { remember: is_remember } = validatedData;


    // Call auth service
    const result = await login(validatedData);

    // Create a server-side session and set httpOnly cookie
    const { token, expiresAt } = await createSession(result.user.id, is_remember ? (DAY_DEFAULT_SESSION_TTL * 30 * 1000) : (DAY_DEFAULT_SESSION_TTL * 1000));
    // res.cookie('session', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'lax',
    //   expires: expiresAt,
    //   path: '/',
    // });

    await SET_CasheSession(token, result.user, is_remember ? WEEK_DEFAULT_SESSION_TTL : DAY_DEFAULT_SESSION_TTL)

    // Return 200 with token, user, and session (so server-side clients e.g. Next.js can set the cookie)
    res.status(200).json({ ...result, sessionToken: token, expiresAt });
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle validation errors
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.reduce((acc: Record<string, string>, err) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          }, {}),
        },
      });
      return;
    }
    // Pass other errors to error handler middleware
    next(error);
  }
};
