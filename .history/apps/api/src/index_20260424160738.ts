import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import app from "./app";
import { redisClient } from "./config/redis";
import { prisma } from "../lib/prisma";

dotenv.config();

const port = process.env.PORT || 3000;

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

redisClient.connect().then(() => console.log('Redis is connected successfully 🚀'));
checkSQLConnection();

// Start server
server.listen(port, async () => {
  console.log(`Server is running on port http://localhost:${port} 🔥`);
});

function checkSQLConnection() {
  try {
    prisma.$connect();
    console.log("SQL is Connected successfully ⚙️");
  } catch (e) {
    console.error("SQL Connection failed", e);
  }
}

export { server };
