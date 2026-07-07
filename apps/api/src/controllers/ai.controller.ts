import type { Response, NextFunction } from "express";
import { ZodError } from "zod";
import OpenAI from "openai";
import type { AuthRequest } from "../types/express";
import { answerMaterialQuestion } from "../services/rag.service";
import { askMaterialSchema } from "../validators/ai.validator";
import { prisma } from "../../lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export const askMaterialQuestionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const classId = Number(req.params.classId);
    const materialId = Number(req.params.materialId);

    if (Number.isNaN(classId) || Number.isNaN(materialId)) {
      res.status(400).json({
        error: {
          message: "Class ID and Material ID are required",
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        classId,
      },
    });

    if (!material) {
      res.status(404).json({
        error: {
          message: "Material not found for this class",
          code: "NOT_FOUND",
        },
      });
      return;
    }

    const question =
      typeof req.body?.question === "string"
        ? req.body.question
        : typeof req.query.question === "string"
          ? req.query.question
          : "";

    const validatedData = askMaterialSchema.parse({ question });

    const result = await answerMaterialQuestion({
      materialId,
      classId,
      question: validatedData.question,
    });

    const contextChunks = result.contextChunks ?? [];

    const contextText = contextChunks.length
      ? contextChunks
          .map((chunk, index) => `[Chunk ${index + 1}] ${chunk}`)
          .join("\n\n")
      : "No relevant context was found in the uploaded material.";

    const systemPrompt = `You are an educational assistant for a class material Q&A system. Answer the student's question using only the provided material context. If the answer is not present in the context, say that you could not find enough relevant information in the uploaded material.`;

    const message = `Question: ${validatedData.question}\n\nMaterial Context:\n${contextText}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ] as const;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let aiResponseBuffer = "";

    const chatCompletion = await openai.chat.completions.create({
      // model: "deepseek-ai/deepseek-v4-flash",
      model: "qwen/qwen3.5-122b-a10b",
      messages: messages as any,
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        aiResponseBuffer += content;
        res.write(`data: ${JSON.stringify({ delta: content })}\n\n`);
      }
    }

    res.write(
      `data: ${JSON.stringify({
        done: true,
        answer: aiResponseBuffer.trim(),
        contextChunks,
        sources: result.sources,
        materialTitle: material.title,
      })}\n\n`,
    );
    res.end();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.issues.reduce((acc: Record<string, string>, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          }, {}),
        },
      });
      return;
    }

    next(error);
  }
};
