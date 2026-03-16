import { prisma } from "../../lib/prisma";
import { randomUUID } from "crypto";
import { redisClient } from "../config/redis";
import type { USER_TYPE } from "../types/user";

const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: number, ttlMs: number = DEFAULT_SESSION_TTL_MS) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + ttlMs);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getSessionByToken(token: string) {
  return prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
}

export async function deleteSession(token: string) {
  return prisma.session.delete({
    where: { token },
  });
}


export async function SET_CasheSession(token: string, user: USER_TYPE, seconds: number) {
  await redisClient.setex(token, seconds, JSON.stringify(user))
}

export async function GET_CasheSession(token: string): Promise<string | null> {
  let user = await redisClient.get(token)
  if (user == null) {
    console.log("Cache miss");
  } else {
    console.log("Cache HIT");
  }
  return user
}
