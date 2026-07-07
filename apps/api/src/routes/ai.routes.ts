import { Router } from "express";
import { askMaterialQuestionController } from "../controllers/ai.controller";
import { isMemberOfClass } from "../middleware/classAuth";

const router = Router();

router.get(
  "/classes/:classId/materials/:materialId/ask",
  isMemberOfClass,
  askMaterialQuestionController,
);
router.post(
  "/classes/:classId/materials/:materialId/ask",
  isMemberOfClass,
  askMaterialQuestionController,
);

export default router;
