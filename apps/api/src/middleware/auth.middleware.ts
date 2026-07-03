import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/express";
import { verifyToken } from "../utils/jwt.util";
import { prisma } from "../../lib/prisma";
import { GET_CasheSession, SET_CasheSession } from "../services/session.service";
import type { USER_TYPE } from "../types/user";

function parseCookies(cookieHeader?: string) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [rawName, ...rest] = pair.trim().split("=");
    if (!rawName) continue;
    const name = decodeURIComponent(rawName);
    const value = decodeURIComponent(rest.join("="));
    cookies[name] = value;
  }
  return cookies;
}

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
    // First try to authenticate via server-side session cookie
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies["session"];
    console.log("sessionToken", sessionToken);

    if (!sessionToken) {
      res.status(401).json({
        error: {
          message: "Authentication required. Please provide a valid token or session.",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }


    let checkChashe = await GET_CasheSession(sessionToken);

    if (!!checkChashe) {
      let user = JSON.parse(checkChashe) as USER_TYPE;
      req.user = {
        id: user.id,
        email: user.email,
      };
      next();
      return;
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });


    if (session && session.expiresAt > new Date()) {
      // await SET_CasheSession(sessionToken,)


      req.user = {
        id: session.user.id,
        email: session.user.email,
      };
      next();
      return;
    } else {
      res.status(401).json({
        error: {
          message: "Authentication required.",
          code: "UNAUTHORIZED",
        },
      });
    }




  } catch (error) {
    res.status(401).json({
      error: {
        message: "Authentication failed.",
        code: "UNAUTHORIZED",
      },
    });
  }
};
