import { promises as fs } from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import { config } from "../config/env";
import { QdrantClient } from "@qdrant/js-client-rest";

export interface IngestMaterialOptions {
  materialId: number;
  classId: number;
  title: string;
  uploadedBy: number;
  filePath: string;
  fileName: string;
  namespace?: string;
}

export interface PineconeVectorPayload {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean>;
}

export interface MaterialQueryOptions {
  materialId: number;
  classId: number;
  question: string;
  namespace?: string;
  topK?: number;
}

export interface MaterialAnswerResult {
  answer: string;
  contextChunks: string[];
  sources: Array<{
    chunkIndex: number;
    score: number;
    fileName?: string;
  }>;
  materialId: number;
  classId: number;
}

export const chunkText = (
  text: string,
  chunkSize: number = config.rag.chunkSize,
  overlap: number = config.rag.chunkOverlap,
): string[] => {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  const words = normalized.split(" ");
  const chunks: string[] = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(words.length, start + chunkSize);
    chunks.push(words.slice(start, end).join(" "));

    if (end === words.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
};

const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty for embedding generation");
    }

    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );

    const output = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    if (!output.data) {
      throw new Error("Embedding generation failed: no data returned");
    }

    const vector = Array.from(output.data as Float32Array);

    if (!vector || vector.length === 0) {
      throw new Error("Generated vector is empty");
    }

    return vector;
  } catch (error) {
    console.error("❌ Local Embedding Error:", error);
    throw new Error(`Failed to generate embedding: ${String(error)}`);
  }
};

const getQdrantClient = () =>
  new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY || "your-api-key",
  });

const upsertVectorsToQdrant = async (
  vectors: PineconeVectorPayload[],
  namespace: string,
): Promise<void> => {
  const client = getQdrantClient();

  // Create collection if it doesn't exist
  const collectionName = namespace;

  try {
    await client.getCollection(collectionName);
  } catch (error) {
    // Collection doesn't exist, create it
    await client.createCollection(collectionName, {
      vectors: {
        size: 384, // all-MiniLM-L6-v2 dimension
        distance: "Cosine",
      },
    });
  }

  // Upsert points
  await client.upsert(collectionName, {
    points: vectors.map((vector, idx) => {
      const vectorIdParts = vector.id.split("-");
      const idNumber = parseInt(vectorIdParts[1] ?? "0", 10);
      const pointId = Number.isNaN(idNumber) ? idx : idNumber;

      return {
        id: pointId,
        vector: vector.values,
        payload: vector.metadata,
      };
    }),
  });
};

const buildAnswerFromContext = (
  question: string,
  contextChunks: string[],
): string => {
  if (!contextChunks.length) {
    return "I couldn't find enough relevant context in this material to answer that question confidently.";
  }

  const normalizedQuestion = question.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const questionWords = normalizedQuestion
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const scoredChunks = contextChunks
    .map((chunk) => {
      const normalizedChunk = chunk.toLowerCase().replace(/[^a-z0-9\s]/g, "");
      const chunkWords = normalizedChunk.split(/\s+/).filter(Boolean);
      const overlap = questionWords.filter((word) =>
        chunkWords.includes(word),
      ).length;

      return {
        chunk,
        score: overlap,
      };
    })
    .sort((a, b) => b.score - a.score);

  const bestChunk = scoredChunks[0]?.chunk ?? contextChunks[0];

  if (!bestChunk) {
    return "I couldn't find enough relevant context in this material to answer that question confidently.";
  }

  const preview =
    bestChunk.length > 500 ? `${bestChunk.slice(0, 500)}...` : bestChunk;

  return `Based on the uploaded material, the most relevant information is: ${preview}`;
};

export const answerMaterialQuestion = async (
  options: MaterialQueryOptions,
): Promise<MaterialAnswerResult> => {
  const { materialId, classId, question, namespace, topK = 5 } = options;

  if (!question || question.trim().length === 0) {
    throw new Error("Question is required");
  }

  const embedding = await generateEmbedding(question);
  const client = getQdrantClient();
  const collectionName = namespace ?? `class-${classId}`;

  try {
    await client.getCollection(collectionName);
  } catch {
    return {
      answer: "I couldn't find any indexed content for this material yet.",
      contextChunks: [],
      sources: [],
      materialId,
      classId,
    };
  }

  const searchResults = await client.search(collectionName, {
    vector: embedding,
    limit: topK,
    with_payload: true,
    filter: {
      must: [
        {
          key: "materialId",
          match: {
            value: String(materialId),
          },
        },
        {
          key: "classId",
          match: {
            value: String(classId),
          },
        },
      ],
    },
  });

  const matchedResults = (searchResults as Array<any>).filter((point) => {
    const payload = point?.payload ?? {};
    return (
      String(payload.materialId ?? "") === String(materialId) &&
      String(payload.classId ?? "") === String(classId)
    );
  });

  const contextChunks = matchedResults
    .map((point) => String(point?.payload?.chunkText ?? ""))
    .filter(Boolean);

  const sources = matchedResults.map((point, index) => ({
    chunkIndex: Number(point?.payload?.chunkIndex ?? index),
    score: Number(point?.score ?? 0),
    fileName: String(point?.payload?.fileName ?? ""),
  }));

  return {
    answer: buildAnswerFromContext(question, contextChunks),
    contextChunks,
    sources,
    materialId,
    classId,
  };
};

export const ingestMaterialToRag = async (
  options: IngestMaterialOptions,
): Promise<void> => {
  try {
    const fileExtension = path.extname(options.fileName).toLowerCase();

    if (fileExtension !== ".pdf") {
      return;
    }

    const absoluteFilePath = path.isAbsolute(options.filePath)
      ? options.filePath
      : path.resolve(options.filePath);

    const fileBuffer = await fs.readFile(absoluteFilePath);
    const pdfParser = new PDFParse({ data: fileBuffer });
    const pdfData = await pdfParser.getText();
    const text = pdfData.text?.trim();

    if (!text) {
      throw new Error("No text could be extracted from the uploaded PDF");
    }

    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return;
    }

    const vectors: PineconeVectorPayload[] = [];
    for (const [index, chunk] of chunks.entries()) {
      if (!chunk || chunk.trim().length === 0) {
        console.warn(`Skipping empty chunk at index ${index}`);
        continue;
      }

      const embedding = await generateEmbedding(chunk);

      if (!embedding || embedding.length === 0) {
        console.warn(`Skipping chunk ${index}: failed to generate embedding`);
        continue;
      }

      vectors.push({
        id: `${options.materialId}-${index}`,
        values: embedding,
        metadata: {
          materialId: String(options.materialId),
          classId: String(options.classId),
          title: options.title,
          uploadedBy: String(options.uploadedBy),
          fileName: options.fileName,
          chunkIndex: String(index),
          chunkText: chunk,
        },
      });
    }

    if (vectors.length === 0) {
      console.warn("No vectors generated for material");
      return;
    }

    await upsertVectorsToQdrant(
      vectors,
      options.namespace ?? `class-${options.classId}`,
    );

    console.log(
      `✅ Successfully ingested ${vectors.length} vectors for material ${options.materialId}`,
    );
  } catch (error) {
    console.error("❌ Failed to ingest material into RAG index:", error);
    throw error;
  }
};
