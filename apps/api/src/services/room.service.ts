import { redis } from '../config/redis';

interface Participant {
  name: string;
  socketId: string;
  userId?: string;
  joinedAt: number;
}

export const addParticipant = async (roomId: string, socketId: string, data: Participant): Promise<void> => {
  const key = `room:${roomId}`;
  const sockKey = `socket:${socketId}`;
  
  await redis.hset(key, socketId, JSON.stringify(data));
  await redis.set(sockKey, roomId);
  await redis.expire(key, 86400); // 24h
};

export const removeParticipant = async (roomId: string, socketId: string): Promise<void> => {
  const key = `room:${roomId}`;
  const sockKey = `socket:${socketId}`;
  
  await redis.hdel(key, socketId);
  await redis.del(sockKey);
};

export const getRoomParticipants = async (roomId: string): Promise<Participant[]> => {
  const key = `room:${roomId}`;
  const fields = await redis.hkeys(key);
  const participants: Participant[] = [];
  
  for (const socketId of fields) {
    const data = await redis.hget(key, socketId);
    if (data) participants.push(JSON.parse(data) as Participant);
  }
  
  return participants;
};

export const getSocketRoom = async (socketId: string): Promise<string | null> => {
  const sockKey = `socket:${socketId}`;
  const roomId = await redis.get(sockKey);
  return roomId || null;
};

export const cleanupEmptyRoom = async (roomId: string): Promise<void> => {
  const participants = await getRoomParticipants(roomId);
  if (participants.length === 0) {
    const key = `room:${roomId}`;
    await redis.del(key);
  }
};

