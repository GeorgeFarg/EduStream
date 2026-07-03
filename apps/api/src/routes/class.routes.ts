import { Router } from 'express';
import {
  addUserToClass,
  createClass,
  getClasses,
  inviteClass,
  joinClass,
  searchClassUsers,
} from '../controllers/class.controller';
import { isTeacherInClass } from '../middleware/classAuth';

const router = Router();

// Create a new class
router.post('/', createClass);
router.get('/', getClasses);

// Join a class using code
router.post('/join', joinClass);

// Invite a student (Teacher only)
router.post('/:id/invite', isTeacherInClass, inviteClass);

// Search users (Teacher only)
router.get('/:id/users/search', isTeacherInClass, searchClassUsers);

// Add user to class as STUDENT (Teacher only)
router.post('/:id/users/add', isTeacherInClass, addUserToClass);

export default router;

