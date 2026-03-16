import { Server, Socket } from "socket.io";
import { addParticipant, removeParticipant, getRoomParticipants, getSocketRoom } from "../services/room.service";

export const setupSocket = (io: Server) => {

  io.on("connection", (socket: Socket) => {

    console.log("[CONNECT]", socket.id);

    socket.on("join-room", async ({ roomId, userName }) => {

      const participant = {
        name: userName || socket.data.user?.name || "Guest",
        socketId: socket.id,
        userId: socket.data.user?.id,
        joinedAt: Date.now()
      };

      await addParticipant(roomId, socket.id, participant);

      socket.join(roomId);
      socket.data.roomId = roomId;

      const participants = await getRoomParticipants(roomId);
      const existingPeers = participants.filter(p => p.socketId !== socket.id);

      socket.emit("room-joined", {
        roomId,
        socketId: socket.id,
        existingPeers: existingPeers.map(p => ({ socketId: p.socketId, userName: p.name })),
        participantCount: participants.length
      });

      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        userName: participant.name
      });

      console.log(`User joined room ${roomId}: ${participant.name}`);
    });

    socket.on("offer", ({ targetSocketId, offer, senderName }) => {
      io.to(targetSocketId).emit("offer", {
        offer,
        senderSocketId: socket.id,
        senderName: senderName || socket.data.userName
      });
    });

    socket.on("answer", ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit("answer", {
        answer,
        senderSocketId: socket.id
      });
    });

    socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit("ice-candidate", {
        candidate,
        senderSocketId: socket.id
      });
    });

    socket.on("chat-message", async ({ roomId, message }) => {
      const participants = await getRoomParticipants(roomId);
      const userName = participants.find(p => p.socketId === socket.id)?.name || "Guest";

      socket.to(roomId).emit("chat-message", {
        socketId: socket.id,
        userName,
        message,
        timestamp: Date.now()
      });
    });

    socket.on("disconnect", async () => {

      const roomId = socket.data.roomId;

      if (roomId) {
        await removeParticipant(roomId, socket.id);
        socket.to(roomId).emit("user-left", {
          socketId: socket.id
        });
        console.log(`User left room ${roomId}: ${socket.id}`);
      }

      console.log("[DISCONNECT]", socket.id);

    });

  });

};