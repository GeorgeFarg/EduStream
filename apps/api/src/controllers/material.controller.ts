import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/express';
import { createMaterialSchema } from '../validators/material.validator';
import {
  createMaterial,
  getAllMaterials,
  getMaterialsByCategory,
  renameMaterial,
  deleteMaterial,
} from '../services/material.service';
import { ZodError } from 'zod';

/**
 * Create a new material
 * @route POST /api/materials
 */
export const createMaterialController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        error: {
          message: 'File is required',
          code: 'FILE_REQUIRED',
        },
      });
      return;
    }

    // Validate request body
    const validatedData = createMaterialSchema.parse(req.body);

    // Extract teacherId from authenticated user
    const teacherId = req.user!.id;

    // Construct file URL (relative path)
    const fileUrl = `/uploads/materials/${req.file.filename}`;

    // Call material service
    const result = await createMaterial({
      title: validatedData.title,
      category: validatedData.category,
      fileUrl,
      uploadedBy: teacherId,
      classId: validatedData.classId,
    });

    // Return 201 with created material
    res.status(201).json(result);
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
 * Get all materials or filter by category for a class
 * @route GET /api/materials
 * @route GET /api/materials?category=X&classId=Y
 */
export const getAllMaterialsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for category query parameter
    const category = req.query.category as string | undefined;
    const classId = Number(req.query.classId);

    if (!classId || isNaN(classId)) {
      res.status(400).json({ error: 'Class ID is required' });
      return;
    }

    let materials;
    if (category) {
      // Filter by category
      materials = await getMaterialsByCategory(classId, category);
    } else {
      // Get all materials
      materials = await getAllMaterials(classId);
    }

    // Return 200 with materials array
    res.status(200).json(materials);
  } catch (error) {
    // Pass errors to error handler middleware
    next(error);
  }
};
/**
 * Delete a material
 * @route DELETE /api/materials/:id
 */
export const deleteMaterialController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const materialId = parseInt(req.params.id, 10);
    if (isNaN(materialId)) {
      res.status(400).json({ error: { message: 'Invalid material ID', code: 'INVALID_ID' } });
      return;
    }

    await deleteMaterial(materialId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Rename a material
 * @route PATCH /api/materials/:id
 */
export const renameMaterialController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const materialId = parseInt(req.params.id, 10);
    if (isNaN(materialId)) {
      res.status(400).json({ error: { message: 'Invalid material ID', code: 'INVALID_ID' } });
      return;
    }

    const { title } = req.body;
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: { message: 'Title is required', code: 'VALIDATION_ERROR' } });
      return;
    }

    const updated = await renameMaterial(materialId, title);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};