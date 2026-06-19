import { Router } from 'express';
import {
  createAnnouncementController,
  getAllAnnouncementsController,
  getAnnouncementByIdController,
} from '../controllers/announcement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isTeacherInClass, isMemberOfClass } from '../middleware/classAuth';
import commentRoutes from './comment.routes';

const router = Router();

router.get('/', authenticate, isMemberOfClass, getAllAnnouncementsController);
router.post('/', authenticate, isTeacherInClass, createAnnouncementController);
router.get('/:id', authenticate, getAnnouncementByIdController);

// Comment routes
router.use('/:announcementId/comments', authenticate, commentRoutes);

export default router;
