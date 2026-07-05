import { Router } from 'express';
import { registerController, loginController } from '../controllers/auth.controller';

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


export default router;
