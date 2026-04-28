import { Router } from 'express';
import {
  createMeetingController,
  getActiveMeetingController,
  joinMeetingController,
  leaveMeetingController,
  endMeetingController,
  getMeetingHistoryController,
} from '../controllers/meeting.controller';

const router = Router({ mergeParams: true });

/**
 * @route GET /api/classes/:classId/meetings/active
 * @desc Get active meeting for a class
 * @access Private (Class members)
 */
router.get('/active', getActiveMeetingController);

/**
 * @route GET /api/classes/:classId/meetings/history
 * @desc Get meeting history for a class
 * @access Private (Class members)
 */
router.get('/history', getMeetingHistoryController);

/**
 * @route POST /api/classes/:classId/meetings
 * @desc Create a new meeting
 * @access Private (Teachers only)
 */
router.post('/', createMeetingController);

/**
 * @route POST /api/classes/:classId/meetings/:meetingId/join
 * @desc Join a meeting
 * @access Private (Class members)
 */
router.post('/:meetingId/join', joinMeetingController);

/**
 * @route POST /api/classes/:classId/meetings/:meetingId/leave
 * @desc Leave a meeting
 * @access Private (Class members)
 */
router.post('/:meetingId/leave', leaveMeetingController);

/**
 * @route POST /api/classes/:classId/meetings/:meetingId/end
 * @desc End a meeting (creator only)
 * @access Private (Meeting creator)
 */
router.post('/:meetingId/end', endMeetingController);

export default router;

