import type { Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";
import type { AuthRequest } from "../types/express";

/**
 * Authentication middleware that verifies JWT token
 * Extracts token from Authorization header, verifies it, and attaches user to request
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    console.log("Auth header", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: {
          message: "Authentication required. Please provide a valid token.",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // Verify token using jwt utility
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        error: {
          message: "Invalid or expired token.",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    // Attach user to request object
    req.user = {
      id: payload.userId,
      email: payload.email,
      // role: payload.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: {
        message: "Authentication failed.",
        code: "UNAUTHORIZED",
      },
    });
  }
};
