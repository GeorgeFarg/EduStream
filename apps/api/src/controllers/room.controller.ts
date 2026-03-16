import type { Request, Response } from "express";
import { rooms } from "../services/room.service";
import { v4 as uuidv4 } from "uuid";

export const createRoom = (req: Request, res: Response) => {

  const roomId = uuidv4().slice(0, 8).toUpperCase();

  rooms[roomId] = {
    participants: {},
    createdAt: Date.now()
  };

  console.log("[API] New room created:", roomId);

  res.json({ roomId });
};

export const getRoom = (req: Request, res: Response) => {

  const roomId = req.params.roomId as string;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: "Room not found" });
  }

  const count = Object.keys(rooms[roomId].participants).length;

  res.json({
    roomId,
    participantCount: count
  });
};