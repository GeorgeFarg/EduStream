// ... imports
import { Router } from 'express';
import {
  createSubmissionController,
  getSubmissionsByAssignmentController,
  gradeSubmissionController,
  getStudentSubmissionsController,
} from '../controllers/submission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSubmission } from '../middleware/upload.middleware';

const router = Router();

/**
 * @route POST /api/assignments/:id/submit
 * @desc Submit an assignment
 * @access Private (Class Members only - verified in controller)
 */
router.post(
  '/assignments/:id/submit',
  authenticate,
  uploadSubmission.single('file'),
  createSubmissionController
);

/**
 * @route GET /api/assignments/:id/submissions
 * @desc Get all submissions for an assignment
 * @access Private (Class Teachers only - verified in controller)
 */
router.get(
  '/assignments/:id/submissions',
  authenticate,
  getSubmissionsByAssignmentController
);

/**
 * @route PATCH /api/submissions/:id/grade
 * @desc Grade a submission
 * @access Private (Class Teachers only - verified in controller)
 */
router.patch(
  '/submissions/:id/grade',
  authenticate,
  gradeSubmissionController
);

/**
 * @route GET /api/submissions/my-submissions
 * @desc Get all submissions for the authenticated student
 * @access Private (Authenticated users)
 */
router.get(
  '/submissions/my-submissions',
  authenticate,
  getStudentSubmissionsController
);


export default router;
