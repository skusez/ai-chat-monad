import type { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
  index,
  vector,
} from "drizzle-orm/pg-core";
import { VECTOR_DB_CONFIG } from "../config";
import { SocialMediaPlan } from "../ai/tools/create-brief";

export const user = pgTable("user", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  tier: varchar("tier", { enum: ["free", "premium"] })
    .notNull()
    .default("free"),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("chat", {
  id: uuid().primaryKey().notNull().defaultRandom(),
  createdAt: timestamp().notNull(),
  title: text().notNull(),
  userId: uuid()
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const ticket = pgTable("ticket", {
  id: uuid().primaryKey().notNull().defaultRandom(),
  chatId: uuid()
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  projectName: text(),
  projectWebsite: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  resolved: boolean().notNull().default(false),
});

export type Ticket = InferSelectModel<typeof ticket>;

export const message = pgTable("message", {
  id: uuid().primaryKey().notNull().defaultRandom(),
  chatId: uuid()
    .notNull()
    .references(() => chat.id),
  role: varchar().notNull(),
  content: json().notNull(),
  createdAt: timestamp().notNull(),
  tokenCount: integer().default(0),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  "vote",
  {
    chatId: uuid()
      .notNull()
      .references(() => chat.id),
    messageId: uuid()
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable("document", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  createdAt: timestamp().notNull(),
  title: text().notNull(),
  content: text(),
  kind: varchar({ enum: ["text", "code", "image", "sheet", "ticket"] })
    .notNull()
    .default("text"),
  userId: uuid()
    .notNull()
    .references(() => user.id),
});

export type Document = InferSelectModel<typeof document>;

export const briefStatus = [
  "pending",
  "approved",
  "rejected",
  "archived",
] as const;

export const brief = pgTable(
  "brief",
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    createdAt: timestamp().notNull(),
    name: text().notNull(),
    description: text(),
    socialMediaPlan: json().$type<SocialMediaPlan[]>(),
    timeline: text(),
    website: text(),
    chatId: uuid()
      .notNull()
      .references(() => chat.id),
    status: text({ enum: briefStatus }).notNull().default("pending"),
    userId: uuid()
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    userIdIndex: index("brief_userId_idx").using("btree", table.userId),
  })
);

export type Brief = InferSelectModel<typeof brief>;

// New table for document embeddings for vector search
export const documentEmbeddings = pgTable(
  "document_embeddings",
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    documentId: uuid()
      .notNull()
      .references(() => document.id),
    embedding: vector("embedding", {
      dimensions: VECTOR_DB_CONFIG.vectorDimension,
    }),
    content: text().notNull(),
    metadata: json(),
    createdAt: timestamp().notNull(),
  },
  (table) => ({
    idx: index("document_embeddings_vector_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

export type DocumentEmbedding = InferSelectModel<typeof documentEmbeddings>;

// New table for tracking token usage for rate limiting
export const tokenUsage = pgTable("token_usage", {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => user.id),
  tokenCount: integer().notNull(),
  model: varchar().notNull(),
  createdAt: timestamp().notNull(),
});

export type TokenUsage = InferSelectModel<typeof tokenUsage>;

export const suggestion = pgTable(
  "suggestion",
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    documentId: uuid().notNull(),
    documentCreatedAt: timestamp().notNull(),
    originalText: text().notNull(),
    suggestedText: text().notNull(),
    description: text(),
    isResolved: boolean().notNull().default(false),
    userId: uuid()
      .notNull()
      .references(() => user.id),
    createdAt: timestamp().notNull(),
  },
  (table) => ({
    documentRef: foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;
