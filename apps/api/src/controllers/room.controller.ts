import type { Request, Response } from "express";
import { getRoomParticipants } from "../services/room.service";
import { v4 as uuidv4 } from "uuid";

export const createRoom = async (req: Request, res: Response) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  // Room created on first participant join via socket, or create empty Redis entry if needed
  console.log("[API] New room prepared:", roomId);
  res.json({ roomId });
};

export const getRoom = async (req: Request, res: Response) => {
  const roomId = req.params.roomId as string;
  const participants = await getRoomParticipants(roomId);
  if (participants.length === 0) {
    return res.status(404).json({ error: "Room not found or empty" });
  }
  res.json({
    roomId,
    participantCount: participants.length
  });
};
