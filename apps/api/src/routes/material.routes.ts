import { Router } from 'express';
import {
  createMaterialController,
  getAllMaterialsController,
  deleteMaterialController,
  renameMaterialController,
} from '../controllers/material.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isTeacherInClass, isMemberOfClass } from '../middleware/classAuth';
import { uploadMaterial } from '../middleware/upload.middleware';

const router = Router();

/**
 * @route DELETE /api/materials/:id
 * @access Private (Teachers only)
 */
router.delete(
  '/:id',
  authenticate,
  isTeacherInClass,
  deleteMaterialController
);

/**
 * @route GET /api/materials
 * @desc Get all materials or filter by category for a class
 * @access Private (Class members)
 */
router.get('/', authenticate, isMemberOfClass, getAllMaterialsController);

/**
 * @route POST /api/materials
 * @desc Create a new material (upload file)
 * @access Private (Teachers of the class only)
 */
router.post(
  '/',
  authenticate,
  uploadMaterial.single('file'),
  isTeacherInClass,
  createMaterialController
);

export default router;
