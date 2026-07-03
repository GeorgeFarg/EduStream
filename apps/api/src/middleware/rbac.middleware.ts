import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/express';

type Role = 'TEACHER' | 'STUDENT';

/**
 * RBAC middleware factory function
 * Creates middleware that checks if authenticated user has required role
 * @param roles - Array of allowed roles
 * @returns Middleware function that enforces role-based access control
 */
export const requireRole = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: {
          message: 'Authentication required.',
          code: 'UNAUTHORIZED',
        },
      });
      return;
    }

    // Check if user's role is in allowed roles array
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          message: 'Insufficient permissions. You do not have access to this resource.',
          code: 'FORBIDDEN',
        },
      });
      return;
    }

    // User has required role, proceed
    next();
  };
};
