import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import app from "./app";
import { redisClient } from "./config/redis";
import { prisma } from "../lib/prisma";

import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./socket/socket.handler";

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

setupSocket(io);

// Middleware
const port = process.env.PORT || 3000;
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


redisClient.connect().then(() => console.log('Redis is connected successfully 🚀'));
checkSQLConnection()
// Start server
app.listen(port, async () => {
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