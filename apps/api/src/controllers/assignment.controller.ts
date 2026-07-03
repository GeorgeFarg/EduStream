import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/express';
import { createAssignmentSchema } from '../validators/assignment.validator';
import {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
} from '../services/assignment.service';
import { ZodError } from 'zod';

/**
 * Create a new assignment
 * @route POST /api/assignments
 */
export const createAssignmentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createAssignmentSchema.parse(req.body);

    // Extract teacherId from authenticated user
    const teacherId = req.user!.id;

    // Handle optional file upload
    const fileUrl = req.file ? `/uploads/materials/${req.file.filename}` : null;

    // Convert ISO string to Date object
    const dueDate = new Date(validatedData.dueDate);

    // Call service
    const assignment = await createAssignment({
      title: validatedData.title,
      description: validatedData.description,
      dueDate,
      teacherId,
      classId: validatedData.classId,
      fileUrl,
    });

    // Return 201 with created assignment
    res.status(201).json(assignment);
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle validation errors
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.reduce((acc: Record<string, string>, err) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          }, {}),
        },
      });
      return;
    }
    // Pass other errors to error handler middleware
    next(error);
  }
};

/**
 * Get all assignments for a class
 * @route GET /api/assignments
 */
export const getAllAssignmentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const classId = Number(req.query.classId);

    if (!classId || isNaN(classId)) {
      res.status(400).json({ error: 'Class ID is required' });
      return;
    }

    // Call service
    const assignments = await getAllAssignments(classId);

    // Return 200 with assignments array
    res.status(200).json(assignments);
  } catch (error) {
    // Pass errors to error handler middleware
    next(error);
  }
};

/**
 * Get a single assignment by ID
 * @route GET /api/assignments/:id
 */
export const getAssignmentByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    // Validate ID is a number
    if (isNaN(id)) {
      res.status(400).json({
        error: {
          message: 'Invalid assignment ID',
          code: 'INVALID_ID',
        },
      });
      return;
    }

    // Call service
    const assignment = await getAssignmentById(id);

    // Return 404 if not found
    if (!assignment) {
      res.status(404).json({
        error: {
          message: 'Assignment not found',
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    // Return 200 with assignment
    res.status(200).json(assignment);
  } catch (error) {
    // Pass errors to error handler middleware
    next(error);
  }
};
