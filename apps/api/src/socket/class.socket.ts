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

export function initializeClassSocket(io: Server) {
  const classNamespace = io.of('/class');

  classNamespace.use(async (socket: AuthenticatedSocket, next) => {
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

  classNamespace.on("connection", (socket: AuthenticatedSocket) => {
    console.log("Class socket connected:", socket.id);

    socket.on("join-class", async ({ classId }) => {
      if (!socket.user) return;

      // Verify user is member of class
      const membership = await prisma.classMembership.findUnique({
        where: {
          userId_classId: { userId: socket.user.id, classId },
        },
      });

      if (!membership) {
        socket.emit("error", { message: "Not a member of this class" });
        return;
      }

      const room = `class:${classId}`;
      await socket.join(room);

      socket.emit("joined-class", { classId, userId: socket.user.id });
      socket.to(room).emit("user-joined-class", {
        userId: socket.user.id,
        name: socket.user.name,
      });
    });

    socket.on("leave-class", ({ classId }) => {
      const room = `class:${classId}`;
      socket.leave(room);
      socket.to(room).emit("user-left-class", {
        userId: socket.user!.id,
        name: socket.user?.name,
      });
    });

    socket.on("disconnect", () => {
      console.log("Class socket disconnected:", socket.id);
    });
  });

  return classNamespace;
}
