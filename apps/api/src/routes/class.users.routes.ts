import { Router } from 'express';
import { getUsersByIds } from '../controllers/class.users.controller';
import { isMemberOfClass } from '../middleware/classAuth';

const router = Router();

// Members-only helper endpoint.
// Allows any class member (teacher or student) to view member profile info.
router.get('/users', isMemberOfClass, getUsersByIds);

export default router;



