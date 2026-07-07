import { z } from "zod";

export const askMaterialSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
});

export type AskMaterialInput = z.infer<typeof askMaterialSchema>;
