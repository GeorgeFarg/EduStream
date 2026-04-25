import { Router } from 'express';
import { registerController, loginController, meController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', registerController);

/**
 * @route POST /api/auth/login
 * @desc Login an existing user
 * @access Public
 */
router.post('/login', loginController);

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user
 * @access Private
 */
router.get('/me', authenticate, meController);

export default router;
