import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/express';
import { createMeetingSchema } from '../validators/meeting.validator';
import * as meetingService from '../services/meeting.service';
import { prisma } from '../../lib/prisma';

function getIo(req: AuthRequest) {
  return (req.app as any).io;
}

export const createMeetingController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createMeetingSchema.parse(req.body);
    const classId = Number(req.params.classId);
    const userId = req.user!.id;

    if (!classId || isNaN(classId)) {
      return res.status(400).json({
        error: { message: 'Valid class ID is required', code: 'INVALID_ID' },
      });
    }

    // Verify user is a member of the class
    const membership = await prisma.classMembership.findUnique({
      where: { userId_classId: { userId, classId } },
    });

    if (!membership) {
      return res.status(403).json({
        error: { message: 'Access denied: You are not a member of this class', code: 'FORBIDDEN' },
      });
    }

    // Only teachers can create meetings
    if (membership.role !== 'TEACHER') {
      return res.status(403).json({
        error: { message: 'Only teachers can start a meeting', code: 'FORBIDDEN' },
      });
    }

    // End any existing active meeting in this class
    const existingMeeting = await meetingService.getActiveMeetingByClass(classId);
    if (existingMeeting) {
      await meetingService.endMeeting(existingMeeting.id, userId);
      const io = getIo(req);
      io.to(`meeting:${existingMeeting.id}`).emit('meeting-ended', { meetingId: existingMeeting.id });
    }

    const meeting = await meetingService.createMeeting({
      title: validatedData.title,
      classId,
      createdBy: userId,
    });

    // Auto-join the creator
    await meetingService.joinMeeting(meeting.id, userId);

    // Emit to class room that a new meeting started
    const io = getIo(req);
    io.emit('meeting-created', { classId, meeting });

    return res.status(201).json(meeting);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.reduce((acc: Record<string, string>, err: any) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          }, {}),
        },
      });
    }
    next(error);
  }
};

export const getActiveMeetingController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const classId = Number(req.params.classId);
    const userId = req.user!.id;

    if (!classId || isNaN(classId)) {
      return res.status(400).json({
        error: { message: 'Valid class ID is required', code: 'INVALID_ID' },
      });
    }

    // Verify user is a member
    const membership = await prisma.classMembership.findUnique({
      where: { userId_classId: { userId, classId } },
    });

    if (!membership) {
      return res.status(403).json({
        error: { message: 'Access denied', code: 'FORBIDDEN' },
      });
    }

    const meeting = await meetingService.getActiveMeetingByClass(classId);
    return res.status(200).json({ meeting });
  } catch (error) {
    next(error);
  }
};

export const joinMeetingController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const meetingId = Number(req.params.meetingId);
    const userId = req.user!.id;

    if (!meetingId || isNaN(meetingId)) {
      return res.status(400).json({
        error: { message: 'Valid meeting ID is required', code: 'INVALID_ID' },
      });
    }

    const meeting = await meetingService.getMeetingById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        error: { message: 'Meeting not found', code: 'NOT_FOUND' },
      });
    }

    if (!meeting.isActive) {
      return res.status(400).json({
        error: { message: 'Meeting has ended', code: 'MEETING_ENDED' },
      });
    }

    // Verify user is a member of the class
    const membership = await prisma.classMembership.findUnique({
      where: { userId_classId: { userId, classId: meeting.classId } },
    });

    if (!membership) {
      return res.status(403).json({
        error: { message: 'Access denied', code: 'FORBIDDEN' },
      });
    }

    const participant = await meetingService.joinMeeting(meetingId, userId);

    // Emit participant joined to meeting room
    const io = getIo(req);
    const updatedMeeting = await meetingService.getMeetingById(meetingId);
    io.to(`meeting:${meetingId}`).emit('participant-joined', {
      userId,
      participant,
      participants: updatedMeeting?.participants || [],
    });

    return res.status(200).json({ participant, meeting });
  } catch (error) {
    next(error);
  }
};

export const leaveMeetingController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const meetingId = Number(req.params.meetingId);
    const userId = req.user!.id;

    if (!meetingId || isNaN(meetingId)) {
      return res.status(400).json({
        error: { message: 'Valid meeting ID is required', code: 'INVALID_ID' },
      });
    }

    await meetingService.leaveMeeting(meetingId, userId);
    return res.status(200).json({ message: 'Left meeting' });
  } catch (error) {
    next(error);
  }
};

export const endMeetingController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const meetingId = Number(req.params.meetingId);
    const userId = req.user!.id;

    if (!meetingId || isNaN(meetingId)) {
      return res.status(400).json({
        error: { message: 'Valid meeting ID is required', code: 'INVALID_ID' },
      });
    }

    const meeting = await meetingService.endMeeting(meetingId, userId);
    if (!meeting) {
      return res.status(403).json({
        error: { message: 'Only the meeting creator can end it', code: 'FORBIDDEN' },
      });
    }

    return res.status(200).json(meeting);
  } catch (error) {
    next(error);
  }
};

export const getMeetingHistoryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const classId = Number(req.params.classId);
    const userId = req.user!.id;

    if (!classId || isNaN(classId)) {
      return res.status(400).json({
        error: { message: 'Valid class ID is required', code: 'INVALID_ID' },
      });
    }

    const membership = await prisma.classMembership.findUnique({
      where: { userId_classId: { userId, classId } },
    });

    if (!membership) {
      return res.status(403).json({
        error: { message: 'Access denied', code: 'FORBIDDEN' },
      });
    }

    const meetings = await meetingService.getMeetingHistory(classId);
    return res.status(200).json({ meetings });
  } catch (error) {
    next(error);
  }
};

