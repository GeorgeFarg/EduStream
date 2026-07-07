import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { updateMeController } from '../controllers/users.controller';

const router = Router();

// Update current user profile
router.patch('/me', authenticate, updateMeController);

export default router;

