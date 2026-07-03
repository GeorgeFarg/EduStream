import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client-runtime-utils';
import { MulterError } from 'multer';

/**
 * Custom API Error class with statusCode and operational flag
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Formats errors into standard JSON response and handles different error types
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  err: Error | ApiError | ZodError | PrismaClientKnownRequestError | MulterError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log errors in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', err);
  }

  /**
   * If the error object has `statusCode` or `code` and `message`, use them.
   * Allow caller to use e.g. ThrowError(404, "user not found") or similar.
   * 
   * The convention is:
   *   - err.statusCode or err.code (code is usually string or number)
   *   - err.message
   */
  const status = (typeof (err as any).statusCode === 'number')
    ? (err as any).statusCode
    : (typeof (err as any).code === 'number'
      ? (err as any).code
      : 500);

  const message =
    (typeof (err as any).message === 'string' && (err as any).message.length > 0)
      ? (err as any).message
      : 'An unexpected error occurred';

  res.status(status).json({
    error: {
      message,
      code: (typeof (err as any).customCode === 'string'
        ? (err as any).customCode
        : (typeof (err as any).code === 'string'
          ? (err as any).code
          : status)),
      // Optionally attach details if provided on the error
      ...(typeof (err as any).details === 'object' && (err as any).details
        ? { details: (err as any).details }
        : {}),
    },
  });
};
