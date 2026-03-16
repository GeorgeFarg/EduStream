import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware";

// Import route modules
import authRoutes from "./routes/auth.routes";
import announcementRoutes from "./routes/announcement.routes";
import materialRoutes from "./routes/material.routes";
import assignmentRoutes from "./routes/assignment.routes";
import submissionRoutes from "./routes/submission.routes";
import classRoutes from "./routes/class.routes";
import { authenticate } from "./middleware/auth.middleware";
import roomRoutes from './routes/room.routes';

const app = express();
app.use(cors());
// Middleware for parsing JSON request bodies
app.use(express.json());

// Middleware for parsing URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// CORS middleware for frontend integration
app.use(
  cors({
    // origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    origin: "http://localhost:3000",
    credentials: true,
  }),
);


app.use('/api/rooms', roomRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));


// Logger middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  const rawBody =
    req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
      ? JSON.stringify(req.body)
      : null;
  const { method, originalUrl } = req;
  let logText = `[REQUEST] ${method} ${originalUrl} | Query: ${JSON.stringify(
    req.query,
  )}`;
  if (rawBody) logText += ` | Body: ${rawBody}`;

  console.log(logText);

  // Capture response data and status
  const defaultSend = res.send;
  let responseBody: any;
  res.send = function (body) {
    responseBody = body;
    return defaultSend.apply(this, arguments as any);
  };

  res.on("finish", () => {
    const ms = Date.now() - start;
    let responseData;
    try {
      responseData =
        typeof responseBody === "string"
          ? JSON.parse(responseBody)
          : responseBody;
    } catch {
      responseData = responseBody;
    }
    console.log(
      `[RESPONSE] ${method} ${originalUrl} | Status: ${res.statusCode} | Time: ${ms}ms | Response: ${JSON.stringify(
        responseData,
      )}`,
    );
  });

  next();
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    message: "EduStream LMS API",
    status: "running",
    version: "1.0.0",
  });
});

// Mount route modules
app.use("/api/auth", authRoutes);

app.use(authenticate);
app.use("/api/classes", classRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api", submissionRoutes); // Mounts /api/assignments/:id/submit and /api/submissions paths

// 404 handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: "NOT_FOUND",
    },
  });
});

app.use(errorHandler);

export default app;
