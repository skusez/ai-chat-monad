import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { documentEmbeddings } from "./schema";
import { VECTOR_DB_CONFIG } from "../config";
import { sql, cosineDistance, gt, desc } from "drizzle-orm";
import { OpenAI } from "openai";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

// Function to create embeddings using OpenAI
export async function createEmbedding(text: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.embeddings.create({
    input: text,
    dimensions: VECTOR_DB_CONFIG.vectorDimension,
    model: "text-embedding-3-small",
  });

  return response.data[0].embedding;
}

// Function to save document embedding
export async function saveDocumentEmbedding({
  documentId,
  content,
  embedding,
  metadata = {},
}: {
  documentId: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}) {
  try {
    return await db.insert(documentEmbeddings).values({
      documentId,
      content,
      embedding,
      metadata,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to save document embedding", error);
    throw error;
  }
}

// Function to search for similar documents
export async function searchSimilarDocuments({
  query,
  limit = VECTOR_DB_CONFIG.maxResults,
  threshold = VECTOR_DB_CONFIG.similarityThreshold,
}: {
  query: string;
  limit?: number;
  threshold?: number;
}) {
  try {
    // Create embedding for the query
    const embedding = await createEmbedding(query);
    const similarity = sql<number>`1 - (${cosineDistance(
      documentEmbeddings.embedding,
      embedding
    )})`;

    // Search for similar documents using cosine similarity with pgVector
    const results = await db
      .select({
        id: documentEmbeddings.id,
        documentId: documentEmbeddings.documentId,
        content: documentEmbeddings.content,
        metadata: documentEmbeddings.metadata,
        similarity,
      })
      .from(documentEmbeddings)
      .where(gt(similarity, threshold))
      .orderBy((t) => desc(t.similarity))
      .limit(limit);

    return results;
  } catch (error) {
    console.error("Failed to search similar documents", error);
    throw error;
  }
}

// Function to process and chunk a document for embedding
export async function processDocumentForEmbedding({
  documentId,
  content,
  chunkSize = 1000,
  chunkOverlap = 200,
}: {
  documentId: string;
  content: string;
  chunkSize?: number;
  chunkOverlap?: number;
}) {
  try {
    // Simple text chunking strategy
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + chunkSize, content.length);
      chunks.push(content.slice(startIndex, endIndex));
      startIndex = endIndex - chunkOverlap;

      // If the remaining text is too small, just include it in the last chunk
      if (content.length - startIndex < chunkSize / 2) {
        break;
      }
    }

    // Create embeddings for each chunk and save them
    for (const chunk of chunks) {
      const embedding = await createEmbedding(chunk);
      await saveDocumentEmbedding({
        documentId,
        content: chunk,
        embedding,
        metadata: { chunkSize, chunkOverlap },
      });
    }

    return { success: true, chunksProcessed: chunks.length };
  } catch (error) {
    console.error("Failed to process document for embedding", error);
    throw error;
  }
}
