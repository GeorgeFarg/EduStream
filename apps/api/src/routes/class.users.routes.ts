import { Router } from 'express';
import { getUsersByIds } from '../controllers/class.users.controller';
import { isTeacherInClass } from '../middleware/classAuth';

const router = Router();

// Public-ish helper endpoint.
// NOTE: In your app you can secure it however you like.
// Here we require teacher-in-class to avoid leaking user data.
router.get('/users', isTeacherInClass, getUsersByIds);

export default router;

