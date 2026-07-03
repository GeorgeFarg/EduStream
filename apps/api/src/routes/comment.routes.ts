import { Router } from 'express';
import {
  getAnnouncementCommentsController,
  createCommentController,
} from '../controllers/comment.controller';

const router = Router({ mergeParams: true });

router.get('/', getAnnouncementCommentsController);
router.post('/', createCommentController);

export default router;
