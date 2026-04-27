import { Router } from 'express';
import {
  createAssignmentController,
  getAllAssignmentsController,
  getAssignmentByIdController,
  deleteAssignmentController,
  updateAssignmentController,
} from '../controllers/assignment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isTeacherInClass, isMemberOfClass } from '../middleware/classAuth';
import { uploadMaterial } from '../middleware/upload.middleware';

const router = Router();

/**
 * @route GET /api/assignments
 * @desc Get all assignments for a class
 * @access Private (Class members)
 */
router.get('/', authenticate, isTeacherInClass, getAllAssignmentsController);

/**
 * @route GET /api/assignments/:id
 * @desc Get a single assignment by ID
 * @access Private (All authenticated users - todo: restrict)
 */
router.get('/:id', authenticate, getAssignmentByIdController);

/**
 * @route POST /api/assignments
 * @desc Create a new assignment
 * @access Private (Teachers of the class only)
 */
router.post(
  '/',
  authenticate,
  uploadMaterial.single('file'),
  isTeacherInClass,
  createAssignmentController
);
router.delete('/:id', authenticate,  deleteAssignmentController);
router.patch('/:id', authenticate, updateAssignmentController);

export default router;
