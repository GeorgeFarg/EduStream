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

// Track which socket belongs to which user in which meeting
const meetingUserSockets: Map<string, Map<number, string>> = new Map();

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
  console.log("connected:", socket.id);

  socket.on("join-meeting", async ({ meetingId }) => {
    if (!socket.user) return;

    const room = `meeting:${meetingId}`;
    await socket.join(room);

    if (!meetingUserSockets.has(room)) {
      meetingUserSockets.set(room, new Map());
    }

    meetingUserSockets.get(room)!.set(socket.user.id, socket.id);

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

    // 1. identify user
    socket.emit("meeting-joined", { userId: socket.user.id });

    // 2. current state
    socket.emit("meeting-state", {
      participants: meeting.participants,
    });

    // 3. notify others
    socket.to(room).emit("participant-joined", {
      userId: socket.user.id,
      name: socket.user.name || "User",
      participants: meeting.participants,
    });
  });

  // ✅ SINGLE disconnect handler ONLY (IMPORTANT)
  socket.on("disconnect", async () => {
    console.log("disconnect:", socket.id);

    for (const [room, roomMap] of meetingUserSockets.entries()) {
      for (const [userId, socketId] of roomMap.entries()) {
        if (socketId === socket.id) {
          roomMap.delete(userId);

          const meetingId = Number(room.replace("meeting:", ""));

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
            userId,
            name: socket.user?.name || "User",
            participants: meeting?.participants || [],
          });
        }
      }

      if (roomMap.size === 0) {
        meetingUserSockets.delete(room);
      }
    }
  });

  // ===== MEDIA EVENTS =====

  socket.on("toggle-mic", ({ meetingId, isMicOn }) => {
    const room = `meeting:${meetingId}`;
    socket.to(room).emit("participant-mic-changed", {
      userId: socket.user!.id,
      isMicOn,
    });
  });

  socket.on("toggle-camera", ({ meetingId, isCameraOn }) => {
    const room = `meeting:${meetingId}`;
    socket.to(room).emit("participant-camera-changed", {
      userId: socket.user!.id,
      isCameraOn,
    });
  });

  socket.on("screen-share", ({ meetingId, isScreenSharing }) => {
    const room = `meeting:${meetingId}`;
    socket.to(room).emit("participant-screen-share-changed", {
      userId: socket.user!.id,
      isScreenSharing,
    });
  });

  // ===== WEBRTC SIGNALING =====

  socket.on("webrtc-offer", ({ meetingId, targetUserId, offer }) => {
    const roomMap = meetingUserSockets.get(`meeting:${meetingId}`);
    const targetSocketId = roomMap?.get(targetUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-offer", {
        userId: socket.user!.id,
        offer,
      });
    }
  });

  socket.on("webrtc-answer", ({ meetingId, targetUserId, answer }) => {
    const roomMap = meetingUserSockets.get(`meeting:${meetingId}`);
    const targetSocketId = roomMap?.get(targetUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-answer", {
        userId: socket.user!.id,
        answer,
      });
    }
  });

  socket.on("webrtc-ice-candidate", ({ meetingId, targetUserId, candidate }) => {
    const roomMap = meetingUserSockets.get(`meeting:${meetingId}`);
    const targetSocketId = roomMap?.get(targetUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-ice-candidate", {
        userId: socket.user!.id,
        candidate,
      });
    }
  });

  // ===== CHAT =====

  socket.on("meeting-chat", ({ meetingId, content }) => {
    const room = `meeting:${meetingId}`;

    io.to(room).emit("meeting-chat-message", {
      id: Date.now(),
      content,
      senderId: socket.user!.id,
      senderName: socket.user?.name || "User",
      createdAt: new Date().toISOString(),
    });
  });
});