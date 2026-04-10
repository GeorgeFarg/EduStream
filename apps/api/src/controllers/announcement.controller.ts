import type { Response, NextFunction } from 'express';
import type { AuthRequest, ClassMemeberRequest } from '../types/express';
import { createAnnouncementSchema } from '../validators/announcement.validator';
import * as announcementService from '../services/announcement.service';

export const createAnnouncementController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Validate request body
        const validatedData = createAnnouncementSchema.parse(req.body);

        // Extract teacherId from authenticated user
        const teacherId = req.user!.id;

        // Call service to create announcement
        const announcement = await announcementService.createAnnouncement({
            ...validatedData,
            teacherId,
        });

        return res.status(201).json(announcement);
    } catch (error) {
        next(error);
    }
};

export const getAllAnnouncementsController = async (
    req: ClassMemeberRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const classId = Number(req.query.classId);

        if (!classId || isNaN(classId)) {
            return res.status(400).json({ error: 'Class ID is required' });
        }

        const announcements = await announcementService.getAllAnnouncements(classId);
        return res.status(200).json({ announcements, memperShip: req.memperShip });
    } catch (error) {
        next(error);
    }
};

export const getAnnouncementByIdController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid announcement ID' });
        }

        const announcement = await announcementService.getAnnouncementById(id);

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        return res.status(200).json(announcement);
    } catch (error) {
        next(error);
    }
};
