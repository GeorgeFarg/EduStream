import { Server, Socket } from "socket.io";
import { prisma } from "../../lib/prisma";
import { GET_CasheSession } from "../services/session.service";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: number;
    email: string;
    name?: string;
  };
}

function parseCookies(cookieHeader?: string): Record<string, string> {
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

export function initializePrivateChatSocket(io: Server) {
  const chatNamespace = io.of('/private-chat');

  chatNamespace.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const cookies = parseCookies(cookieHeader);
      const sessionToken = cookies["session"];

      if (!sessionToken) {
        return next(new Error("Authentication required"));
      }

      const cached = await GET_CasheSession(sessionToken);
      if (cached) {
        const user = JSON.parse(cached);
        socket.user = { id: user.id, email: user.email, name: user.name };
        return next();
      }

      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
      });

      if (session && session.expiresAt > new Date()) {
        socket.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        };
        return next();
      }

      next(new Error("Invalid or expired session"));
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  chatNamespace.on("connection", (socket: AuthenticatedSocket) => {
    if (!socket.user) return;
    const userId = socket.user.id;
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    console.log(`Private chat socket connected: ${socket.id} for user ${userId}`);

    socket.on("disconnect", () => {
      console.log(`Private chat socket disconnected: ${socket.id} for user ${userId}`);
    });
  });

  return chatNamespace;
}
