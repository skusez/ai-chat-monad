import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  type InferInsertModel,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  ticket,
  userTicket,
  type MessageInsert,
  adminChat,
  adminMessage,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { processTicketQuestionForEmbedding } from './vector';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
  isAdmin,
}: {
  id: string;
  userId: string;
  title: string;
  isAdmin: boolean;
}) {
  try {
    return await db.insert(isAdmin ? adminChat : chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({
  id,
  isAdmin,
}: {
  id: string;
  isAdmin: boolean;
}) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db
      .delete(isAdmin ? adminChat : chat)
      .where(eq(isAdmin ? adminChat.id : chat.id, id));

    return await db
      .delete(isAdmin ? adminChat : chat)
      .where(eq(isAdmin ? adminChat.id : chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({
  id,
  isAdmin,
}: {
  id: string;
  isAdmin: boolean;
}) {
  try {
    return await db
      .select()
      .from(isAdmin ? adminChat : chat)
      .where(eq(isAdmin ? adminChat.userId : chat.userId, id))
      .orderBy(desc(isAdmin ? adminChat.createdAt : chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({
  id,
  isAdmin,
}: {
  id: string;
  isAdmin: boolean;
}) {
  const table = isAdmin ? adminChat : chat;
  const idColumn = isAdmin ? adminChat.id : chat.id;
  const [selectedChat] = await db.select().from(table).where(eq(idColumn, id));
  return selectedChat as typeof isAdmin extends true
    ? typeof adminChat.$inferSelect
    : typeof chat.$inferSelect;
}

export async function saveMessages({
  messages,
  isAdmin,
}: {
  messages: Array<MessageInsert>;
  isAdmin: boolean;
}) {
  try {
    return await db.insert(isAdmin ? adminMessage : message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error, { messages });
  }
}

export async function getMessagesByChatId({
  id,
  isAdmin,
}: {
  id: string;
  isAdmin: boolean;
}) {
  const table = isAdmin ? adminMessage : message;
  try {
    return await db
      .select()
      .from(table)
      .where(eq(table.chatId, id))
      .orderBy(asc(table.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function saveTicket({
  chatId,
  question,
  userId,
  messageId,
}: InferInsertModel<typeof ticket> & { userId: string; messageId: string }) {
  try {
    const [newTicket] = await db
      .insert(ticket)
      .values({
        chatId,
        question,
        messageId,
        resolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    await Promise.all([
      processTicketQuestionForEmbedding({
        ticketId: newTicket.id,
        content: question,
      }),
      addUserToTicket({
        userId,
        ticketId: newTicket.id,
        chatId,
      }),
    ]);

    return newTicket;
  } catch (error) {
    console.error('Failed to create ticket in database');
    throw error;
  }
}

export async function addUserToTicket({
  userId,
  ticketId,
  chatId,
}: {
  userId: string;
  ticketId: string;
  chatId: string;
}) {
  try {
    return await db
      .insert(userTicket)
      .values({
        userId,
        ticketId,
        chatId,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error('Failed to add user to ticket in database', error);
    throw error;
  }
}

export async function updateTicket({
  chatId,
  projectName,
  projectWebsite,
  resolved = false,
}: {
  chatId: string;
  projectName?: string;
  projectWebsite?: string;
  resolved?: boolean;
}) {
  try {
    const updateData: Record<string, any> = {};

    if (projectName !== undefined) updateData.projectName = projectName;
    if (projectWebsite !== undefined)
      updateData.projectWebsite = projectWebsite;
    if (resolved !== undefined) updateData.resolved = resolved;

    return await db
      .update(ticket)
      .set(updateData)
      .where(eq(ticket.chatId, chatId));
  } catch (error) {
    console.error('Failed to update ticket in database');
    throw error;
  }
}

export async function getTicketByChatId({ chatId }: { chatId: string }) {
  try {
    const tickets = await db
      .select()
      .from(ticket)
      .where(eq(ticket.chatId, chatId));

    return tickets.length > 0 ? tickets[0] : null;
  } catch (error) {
    console.error('Failed to get ticket by chatId from database');
    throw error;
  }
}

export async function notifyUsersSubscribedToTicket({
  ticketId,
  result,
}: {
  ticketId: string;
  result: string;
}) {
  try {
    const chats = await db
      .select({
        chatId: userTicket.chatId,
      })
      .from(userTicket)
      .where(eq(userTicket.ticketId, ticketId));

    // insert a message to their chat
    await Promise.all([
      db.insert(message).values(
        chats.map((chat) => ({
          chatId: chat.chatId,
          role: 'assistant',
          content: result,
          createdAt: new Date(),
          tokenCount: 0,
        })),
      ),
      // set the notification count
      db
        .update(chat)
        .set({
          questionAnsweredCount: sql`${chat.questionAnsweredCount} + 1`,
        })
        .where(
          inArray(
            chat.id,
            chats.map((chat) => chat.chatId),
          ),
        ),
    ]);
  } catch (error) {
    console.error('Failed to notify users subscribed to ticket in database');
    throw error;
  }
}

export async function deleteTicketsByIds({
  ticketIds,
}: {
  ticketIds: string[];
}) {
  try {
    return await db.delete(ticket).where(inArray(ticket.id, ticketIds));
  } catch (error) {
    console.error('Failed to delete tickets by ids from database');
    throw error;
  }
}

export async function getTicketsByIds(ticketIds: string[]) {
  try {
    return await db.select().from(ticket).where(inArray(ticket.id, ticketIds));
  } catch (error) {
    console.error('Failed to get tickets by ids from database');
    throw error;
  }
}

export async function getUnresolvedQuestions() {
  try {
    const questions = await db
      .select({
        ticket,
        userTicketCount: sql<number>`COUNT(${userTicket.ticketId})`.as(
          'userTicketCount',
        ),
      })
      .from(ticket)
      .leftJoin(userTicket, eq(ticket.id, userTicket.ticketId))
      .where(eq(ticket.resolved, false))
      .groupBy(ticket.id);
    return questions;
  } catch (error) {
    console.error('Failed to get unresolved questions from database');
    throw error;
  }
}

export type Question = Awaited<
  ReturnType<typeof getUnresolvedQuestions>
>[number];
