import { z } from 'zod';

export const createAssignmentSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must not exceed 200 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must not exceed 2000 characters'),
    dueDate: z.string().datetime('Due date must be in ISO 8601 datetime format'),
    classId: z.coerce.number().int().positive('Class ID must be a positive integer'),
});

export const gradeSubmissionSchema = z.object({
    grade: z.number().min(0, 'Grade must be at least 0').max(100, 'Grade must not exceed 100'),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
