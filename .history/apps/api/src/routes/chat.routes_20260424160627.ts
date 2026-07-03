import { Router } from 'express';
import {
  getClassMessagesController,
  createMessageController,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

/**
 * @route GET /api/classes/:classId/chat
 * @desc Get all chat messages for a class
 * @access Private (Class members only)
 */
router.get('/', authenticate, getClassMessagesController);

/**
 * @route POST /api/classes/:classId/chat
 * @desc Send a new chat message
 * @access Private (Class members only)
 */
router.post('/', authenticate, createMessageController);

export default router;

