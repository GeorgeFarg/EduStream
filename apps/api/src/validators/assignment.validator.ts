// validators/assignment.validator.ts
import { z } from "zod";

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  dueDate: z.string().min(1, "Due date is required"),
  classId: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "classId must be a positive number",
    }),
});

// ← أضف الـ schema ده
export const gradeSubmissionSchema = z.object({
  grade: z
    .number()
    .min(0, "Grade must be at least 0")
    .max(100, "Grade cannot exceed 100"),
  feedback: z.string().optional().default(""),
});