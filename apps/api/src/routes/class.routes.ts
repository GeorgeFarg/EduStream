import { Router } from 'express';
import { createClass, joinClass, inviteClass, getClasses } from '../controllers/class.controller';
import { isTeacherInClass } from '../middleware/classAuth';

const router = Router();

// Create a new class
router.post('/', createClass);
router.get('/', getClasses);

// Join a class using code
router.post('/join', joinClass);

// Invite a student (Teacher only)
// Note: We need to ensure the user is a teacher of this class.
// The checks are inside the controller or we can add middleware.
router.post('/:id/invite', isTeacherInClass, inviteClass);

export default router;
