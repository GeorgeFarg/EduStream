import { Router } from 'express';
import {
  getConversationsController,
  getMessagesController,
  sendMessageController,
} from '../controllers/privateChat.controller';

const router = Router();

/**
 * @route GET /api/private-chat/conversations
 * @desc Get all conversations for the current user
 * @access Private
 */
router.get('/conversations', getConversationsController);

/**
 * @route GET /api/private-chat/messages/:userId
 * @desc Get messages between current user and another user
 * @access Private
 */
router.get('/messages/:userId', getMessagesController);

/**
 * @route POST /api/private-chat/messages/:userId
 * @desc Send a private message to another user
 * @access Private
 */
router.post('/messages/:userId', sendMessageController);

export default router;

