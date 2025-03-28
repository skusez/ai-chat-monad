import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { VECTOR_DB_CONFIG } from '../config';
import type { AdapterAccountType } from 'next-auth/adapters';

export const user = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  name: text('name'),
  password: text('password'),
  tier: text('tier', { enum: ['free', 'premium'] })
    .notNull()
    .default('free'),
  isAdmin: boolean().notNull().default(false),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('chat', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  createdAt: timestamp().notNull(),
  title: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export const adminChat = pgTable('admin_chat', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  createdAt: timestamp().notNull(),
  title: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id),
});

export type Chat = InferSelectModel<typeof chat> & {
  isAnswerRead: boolean;
};

export const ticket = pgTable('ticket', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chat_id')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => message.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  resolved: boolean('resolved').notNull().default(false),
});

export const ticketQuestionEmbeddings = pgTable(
  'ticket_question_embeddings',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    // optional ticketId to resolve question
    ticketId: uuid().references(() => ticket.id, { onDelete: 'cascade' }),
    embedding: vector('embedding', {
      dimensions: VECTOR_DB_CONFIG.vectorDimension,
    }),
    metadata: json(),
    content: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    idx: index('ticket_question_embeddings_vector_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);

export const ticketAnswerEmbeddings = pgTable(
  'ticket_answer_embeddings',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    // optional ticketId to resolve question
    ticketId: uuid().references(() => ticket.id, { onDelete: 'set null' }),
    embedding: vector('embedding', {
      dimensions: VECTOR_DB_CONFIG.vectorDimension,
    }),
    source: text()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    metadata: json(),
    content: text().notNull(),
    updatedAt: timestamp().notNull().defaultNow(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    uniqueSource: uniqueIndex('unique_source').on(table.source),
    idx: index('ticket_answer_embeddings_vector_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);

export type TicketQuestionEmbedding = InferSelectModel<
  typeof ticketQuestionEmbeddings
>;
export type TicketQuestionEmbeddingInsert = InferInsertModel<
  typeof ticketQuestionEmbeddings
>;

export type TicketAnswerEmbedding = InferSelectModel<
  typeof ticketAnswerEmbeddings
>;
export type TicketAnswerEmbeddingInsert = InferInsertModel<
  typeof ticketAnswerEmbeddings
>;

export const userTicket = pgTable('user_ticket', {
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  ticketId: uuid()
    .notNull()
    .references(() => ticket.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  chatId: uuid()
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
});
export type Ticket = InferSelectModel<typeof ticket>;

export const message = pgTable('message', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  chatId: uuid()
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  role: varchar().notNull(),
  content: json().notNull(),
  createdAt: timestamp().notNull(),
  tokenCount: integer().default(0),
});

export const adminMessage = pgTable('admin_message', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  chatId: uuid()
    .notNull()
    .references(() => adminChat.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  role: varchar().notNull(),
  content: json().notNull(),
  createdAt: timestamp().notNull(),
  tokenCount: integer().default(0),
});

export type Message = InferSelectModel<typeof message>;
export type MessageInsert = InferInsertModel<typeof message>;

export const vote = pgTable(
  'vote',
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
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable('document', {
  id: uuid().notNull().defaultRandom().primaryKey(),
  createdAt: timestamp().notNull(),
  title: text().notNull(),
  content: text(),
  kind: varchar({ enum: ['text', 'code', 'image', 'sheet'] })
    .notNull()
    .default('text'),
  userId: text()
    .notNull()
    .references(() => user.id),
});

export type Document = InferSelectModel<typeof document>;

// New table for document embeddings for vector search
export const documentEmbeddings = pgTable(
  'document_embeddings',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    documentId: uuid()
      .notNull()
      .references(() => document.id),
    embedding: vector('embedding', {
      dimensions: VECTOR_DB_CONFIG.vectorDimension,
    }),
    content: text().notNull(),
    metadata: json(),
    createdAt: timestamp().notNull(),
  },
  (table) => ({
    idx: index('document_embeddings_vector_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);

export type DocumentEmbedding = InferSelectModel<typeof documentEmbeddings>;

// New table for tracking token usage for rate limiting
export const tokenUsage = pgTable('token_usage', {
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id),
  tokenCount: integer().notNull(),
  model: varchar().notNull(),
  createdAt: timestamp().notNull(),
});

export type TokenUsage = InferSelectModel<typeof tokenUsage>;

export const suggestion = pgTable(
  'suggestion',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    documentId: uuid().notNull(),
    documentCreatedAt: timestamp().notNull(),
    originalText: text().notNull(),
    suggestedText: text().notNull(),
    description: text(),
    isResolved: boolean().notNull().default(false),
    userId: text()
      .notNull()
      .references(() => user.id),
    createdAt: timestamp().notNull(),
  },
  (table) => ({
    documentRef: foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

/** Auth tables */

export const account = pgTable(
  'account',
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text().$type<AdapterAccountType>().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refresh_token: text(),
    access_token: text(),
    expires_at: integer(),
    token_type: text(),
    scope: text(),
    id_token: text(),
    session_state: text(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  }),
);

export const session = pgTable('session', {
  sessionToken: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expires: timestamp({ mode: 'date' }).notNull(),
});

export const verificationToken = pgTable(
  'verification_token',
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ mode: 'date' }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({
      columns: [table.identifier, table.token],
    }),
  }),
);

export const authenticator = pgTable(
  'authenticator',
  {
    // @dev stupid fucking authjs enforcing weird shit
    userId: text('userid')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    credentialID: text('credentialid').notNull().unique(),
    providerAccountId: text().notNull(),
    credentialPublicKey: text().notNull(),
    counter: integer().notNull(),
    credentialDeviceType: text().notNull(),
    credentialBackedUp: boolean().notNull(),
    transports: text(),
  },
  (table) => ({
    compositePK: primaryKey({
      name: 'authenticator_userid_credentialid_pk',
      columns: [table.userId, table.credentialID],
    }),
  }),
);
