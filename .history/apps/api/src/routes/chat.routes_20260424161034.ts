import { Router } from 'express';
import {
  getClassMessagesController,
  createMessageController,
} from '../controllers/chat.controller';

const router = Router({ mergeParams: true });

/**
 * @route GET /api/classes/:classId/chat
 * @desc Get all chat messages for a class
 * @access Private (Class members only)
 */
router.get('/', getClassMessagesController);

/**
 * @route POST /api/classes/:classId/chat
 * @desc Send a new chat message
 * @access Private (Class members only)
 */
router.post('/', createMessageController);

export default router;

