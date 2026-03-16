import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./socket/socket.handler";
import app from "./app";


import { prisma } from "../lib/prisma";
import { GET_CasheSession } from "./services/session.service";

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  },
});

// Redis pub/sub adapter (optional for now, redisClient is node-redis not ioredis; skip duplicate to avoid error)
console.log('Socket.IO ready (Redis adapter optional for single instance)');


setupSocket(io);


async function checkSQLConnection() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected ⚙️");
  } catch (e) {
    console.error("PostgreSQL connection failed:", e);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  await checkSQLConnection();
  console.log(`API + Socket server running on http://localhost:${PORT}`);
});
