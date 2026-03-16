import { Router } from "express";
import { createRoom, getRoom } from "../controllers/room.controller";

const router = Router();

router.post("/", createRoom);
router.get("/:roomId", getRoom);

export default router;