import { io } from "socket.io-client";

export const SERVER_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "";

export const socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
  autoConnect: false,
});