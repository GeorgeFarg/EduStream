import { z } from "zod";

export const createMaterialSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),
  category: z.string().min(2, "Category must be at least 2 characters"),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
