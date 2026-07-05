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

export function initializeMeetingSocket(io: Server) {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const cookies = parseCookies(cookieHeader);
      const sessionToken = cookies["session"];

      if (!sessionToken) {
        return next(new Error("Authentication required"));
      }

      // Try cache first
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

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.user?.id})`);

    // Join a specific meeting room
    socket.on("join-meeting", async ({ meetingId }: { meetingId: number }) => {
      if (!socket.user) return;
      const room = `meeting:${meetingId}`;
      await socket.join(room);

      // Fetch updated participant list
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          participants: {
            where: { leftAt: null },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      if (!meeting) return;

      // Notify others in the room
      socket.to(room).emit("participant-joined", {
        userId: socket.user.id,
        name: socket.user.name || "User",
        participants: meeting.participants,
      });

      // Send current participants to the joining user
      socket.emit("meeting-state", {
        participants: meeting.participants,
      });
    });

    // Leave a meeting room
    socket.on("leave-meeting", async ({ meetingId }: { meetingId: number }) => {
      if (!socket.user) return;
      const room = `meeting:${meetingId}`;
      socket.leave(room);

      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          participants: {
            where: { leftAt: null },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      socket.to(room).emit("participant-left", {
        userId: socket.user.id,
        name: socket.user.name || "User",
        participants: meeting?.participants || [],
      });
    });

    // Toggle mic state
    socket.on("toggle-mic", ({ meetingId, isMicOn }: { meetingId: number; isMicOn: boolean }) => {
      if (!socket.user) return;
      const room = `meeting:${meetingId}`;
      socket.to(room).emit("participant-mic-changed", {
        userId: socket.user.id,
        isMicOn,
      });
    });

    // Toggle camera state
    socket.on("toggle-camera", ({ meetingId, isCameraOn }: { meetingId: number; isCameraOn: boolean }) => {
      if (!socket.user) return;
      const room = `meeting:${meetingId}`;
      socket.to(room).emit("participant-camera-changed", {
        userId: socket.user.id,
        isCameraOn,
      });
    });

    // Screen share state
    socket.on("screen-share", ({ meetingId, isScreenSharing }: { meetingId: number; isScreenSharing: boolean }) => {
      if (!socket.user) return;
      const room = `meeting:${meetingId}`;
      socket.to(room).emit("participant-screen-share-changed", {
        userId: socket.user.id,
        isScreenSharing,
      });
    });

    // In-meeting chat message
    socket.on("meeting-chat", ({ meetingId, content }: { meetingId: number; content: string }) => {
      if (!socket.user) return;
      const room = `meeting:${meetingId}`;
      const message = {
        id: Date.now(), // temporary id for client
        content,
        senderId: socket.user.id,
        senderName: socket.user.name || "User",
        createdAt: new Date().toISOString(),
      };
      io.to(room).emit("meeting-chat-message", message);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${socket.user?.id})`);
    });
  });
}

