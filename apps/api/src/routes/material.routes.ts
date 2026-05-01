import { Router } from "express";
import {
  createMaterialController,
  getAllMaterialsController,
} from "../controllers/material.controller";
import { authenticate } from "../middleware/auth.middleware";
import { isTeacherInClass, isMemberOfClass } from "../middleware/classAuth";
import { uploadMaterial } from "../middleware/upload.middleware";

const router = Router();

/**
 * @route GET /api/materials
 * @desc Get all materials or filter by category for a class
 * @access Private (Class members)
 */
router.get("/", authenticate, isMemberOfClass, getAllMaterialsController);

/**
 * @route POST /api/materials
 * @desc Create a new material (upload file)
 * @access Private (Teachers of the class only)
 */
router.post(
  "/:classId",
  authenticate,
  isTeacherInClass,
  uploadMaterial.single("file"),
  createMaterialController,
);

export default router;
