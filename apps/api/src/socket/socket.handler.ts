import { Server, Socket } from "socket.io";
import { rooms } from "../services/room.service";

export const setupSocket = (io: Server) => {

  io.on("connection", (socket: Socket) => {

    console.log("[CONNECT]", socket.id);

    socket.on("join-room", ({ roomId, userName }) => {

      if (!rooms[roomId]) {
        rooms[roomId] = { participants: {}, createdAt: Date.now() };
      }

      const room = rooms[roomId];

      room.participants[socket.id] = {
        name: userName || "Guest",
        socketId: socket.id
      };

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userName = userName;

      const existingPeers = Object.entries(room.participants)
        .filter(([id]) => id !== socket.id)
        .map(([id, info]: any) => ({
          socketId: id,
          userName: info.name
        }));

      socket.emit("room-joined", {
        roomId,
        socketId: socket.id,
        existingPeers,
        participantCount: Object.keys(room.participants).length
      });

      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        userName
      });

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

    socket.on("chat-message", ({ roomId, message }) => {

      const room = rooms[roomId];
      const userName = room?.participants?.[socket.id]?.name || "Guest";

      io.to(roomId).emit("chat-message", {
        socketId: socket.id,
        userName,
        message,
        timestamp: Date.now()
      });

    });

    socket.on("disconnect", () => {

      const roomId = socket.data.roomId;

      if (roomId && rooms[roomId]) {

        delete rooms[roomId].participants[socket.id];

        socket.to(roomId).emit("user-left", {
          socketId: socket.id
        });

        if (Object.keys(rooms[roomId].participants).length === 0) {

          setTimeout(() => {

            if (
              rooms[roomId] &&
              Object.keys(rooms[roomId].participants).length === 0
            ) {
              delete rooms[roomId];
              console.log("[CLEANUP] Room deleted:", roomId);
            }

          }, 10000);

        }

      }

      console.log("[DISCONNECT]", socket.id);

    });

  });

};