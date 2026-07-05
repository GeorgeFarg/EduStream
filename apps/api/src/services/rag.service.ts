import { promises as fs } from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import { config } from "../config/env";

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
    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );

    const output = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(output.data as Float32Array);

    return vector;
  } catch (error) {
    console.error("❌ Local Embedding Error:", error);
    throw new Error(`Failed to generate embedding: ${String(error)}`);
  }
};

const upsertVectorsToPinecone = async (
  vectors: PineconeVectorPayload[],
  namespace: string,
): Promise<void> => {
  if (!config.rag.pineconeApiKey || !config.rag.pineconeIndexName) {
    throw new Error("Pinecone configuration is incomplete");
  }

  const pinecone = new Pinecone({
    apiKey: config.rag.pineconeApiKey,
  });

  const index = pinecone.Index(config.rag.pineconeIndexName);
  await index.namespace(namespace).upsert({
    records: vectors.map((vector) => ({
      id: vector.id,
      values: vector.values,
      metadata: vector.metadata,
    })),
  });
};

export const ingestMaterialToRag = async (
  options: IngestMaterialOptions,
): Promise<void> => {
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
    const embedding = await generateEmbedding(chunk);

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

  await upsertVectorsToPinecone(
    vectors,
    options.namespace ?? `class-${options.classId}`,
  );
};
