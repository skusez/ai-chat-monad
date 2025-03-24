import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  documentEmbeddings,
  ticketAnswerEmbeddings,
  type TicketQuestionEmbeddingInsert,
  ticketQuestionEmbeddings,
  type TicketAnswerEmbeddingInsert,
} from './schema';
import { VECTOR_DB_CONFIG } from '../config';
import { sql, cosineDistance, gt, desc } from 'drizzle-orm';
import { aiProvider, DEFAULT_TEXT_EMBEDDING_MODEL } from '../ai/models';
import { embed } from 'ai';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

// Function to create embeddings using OpenAI
export async function createEmbedding(text: string) {
  const response = await embed({
    model: aiProvider.textEmbeddingModel(DEFAULT_TEXT_EMBEDDING_MODEL),
    value: text,
  });

  return response.embedding;
}

export async function ragSearch({
  query,
  limit = VECTOR_DB_CONFIG.maxResults,
  threshold = VECTOR_DB_CONFIG.similarityThreshold,
}: {
  query: string;
  limit?: number;
  threshold?: number;
}) {
  try {
    const embedding = await createEmbedding(query);
    const similarity = sql<number>`1 - (${cosineDistance(
      ticketAnswerEmbeddings.embedding,
      embedding,
    )})`;

    const results = await db
      .select({
        id: ticketAnswerEmbeddings.id,
        ticketId: ticketAnswerEmbeddings.ticketId,
        content: ticketAnswerEmbeddings.content,
        metadata: ticketAnswerEmbeddings.metadata,
        similarity,
        source: ticketAnswerEmbeddings.source,
      })
      .from(ticketAnswerEmbeddings)
      .where(gt(similarity, threshold))
      .orderBy((t) => desc(t.similarity))
      .limit(limit);
    console.log({ results });

    return results;
  } catch (error) {
    console.error('Failed to search documents', error);
    throw error;
  }
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
    console.error('Failed to save document embedding', error);
    throw error;
  }
}

// Function to process and chunk a document for embedding
export async function processTicketAnswerForEmbedding({
  ticketId,
  content,
  source,
  chunkSize = 1000,
  chunkOverlap = 200,
}: {
  ticketId: string | undefined;
  content: string;
  source: string | undefined;
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
      await saveTicketAnswerEmbedding({
        ticketId,
        content: chunk,
        embedding,
        source,
        metadata: { chunkSize, chunkOverlap },
      });
    }

    return { success: true, chunksProcessed: chunks.length };
  } catch (error) {
    console.error('Failed to process ticket for embedding', error);
    throw error;
  }
}
export async function processTicketQuestionForEmbedding({
  ticketId,
  content,
  chunkSize = 1000,
  chunkOverlap = 200,
}: {
  ticketId: string | undefined;
  content: string;
  chunkSize?: number;
  chunkOverlap?: number;
}) {
  console.log('Processing ticket question for embedding', ticketId);
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
      await saveTicketQuestionEmbedding({
        ticketId,
        content: chunk,
        embedding,
        metadata: { chunkSize, chunkOverlap },
      });
    }

    return { success: true, chunksProcessed: chunks.length };
  } catch (error) {
    console.error('Failed to process ticket for embedding', error);
    throw error;
  }
}

export async function searchSimilarTicketQuestions({
  query,
  limit = VECTOR_DB_CONFIG.maxResults,
  threshold = VECTOR_DB_CONFIG.similarityThreshold,
}: {
  query: string;
  limit?: number;
  threshold?: number;
}) {
  try {
    const embedding = await createEmbedding(query);
    const similarity = sql<number>`1 - (${cosineDistance(
      ticketQuestionEmbeddings.embedding,
      embedding,
    )})`;

    const results = await db
      .select({
        id: ticketQuestionEmbeddings.id,
        ticketId: ticketQuestionEmbeddings.ticketId,
        content: ticketQuestionEmbeddings.content,
        metadata: ticketQuestionEmbeddings.metadata,
        similarity,
      })
      .from(ticketQuestionEmbeddings)
      .where(gt(similarity, threshold))
      .orderBy((t) => desc(t.similarity))
      .limit(limit);

    return results;
  } catch (error) {
    console.error('Failed to search similar tickets', error);
    throw error;
  }
}

export async function saveTicketAnswerEmbedding({
  ticketId,
  embedding,
  content,
  source,
  metadata = {},
}: Omit<TicketAnswerEmbeddingInsert, 'createdAt'>) {
  try {
    return await db
      .insert(ticketAnswerEmbeddings)
      .values({
        ticketId,
        embedding,
        content,
        source,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: ticketAnswerEmbeddings.source,
        set: {
          content,
          embedding,
          metadata,
          updatedAt: new Date(),
          ticketId,
        },
      });
  } catch (error) {
    console.error('Failed to save ticket embedding', error);
    throw error;
  }
}

export async function saveTicketQuestionEmbedding({
  ticketId,
  embedding,
  content,
  metadata = {},
}: Omit<TicketQuestionEmbeddingInsert, 'createdAt'>) {
  try {
    return await db.insert(ticketQuestionEmbeddings).values({
      ticketId,
      embedding,
      content,
      metadata,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save ticket question embedding', error);
    throw error;
  }
}
