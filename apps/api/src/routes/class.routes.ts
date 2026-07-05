import { Router } from 'express';
import {
  addUserToClass,
  createClass,
  deleteClass,
  deleteClassMembershipLeave,
  getClasses,
  getClassById,
  inviteClass,
  joinClass,
  searchClassUsers,
  updateClass,
} from '../controllers/class.controller';



import { isTeacherInClass } from '../middleware/classAuth';

const router = Router();

// Create a new class
router.post('/', createClass);
router.get('/', getClasses);

// Join a class using code
router.post('/join', joinClass);

// Update class details (Teachers only)
router.patch('/:classId', isTeacherInClass, updateClass);

// Get class details (Teachers only)
router.get('/:classId', isTeacherInClass, getClassById);

// Invite a student (Teacher only)
router.post('/:id/invite', isTeacherInClass, inviteClass);

// Search users (Teacher only)
router.get('/:id/users/search', isTeacherInClass, searchClassUsers);

// Add user to class as STUDENT (Teacher only)
router.post('/:id/users/add', isTeacherInClass, addUserToClass);

// Delete a class (Teachers only)
router.delete('/:classId', isTeacherInClass, deleteClass);

// Leave class (remove membership for current user)
// No teacher-only restriction: any member can leave.
router.delete('/:classId/leave', deleteClassMembershipLeave);

export default router;




