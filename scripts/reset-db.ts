import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import {
  adminMessage,
  adminChat,
  authenticator,
  chat,
  document,
  documentEmbeddings,
  message,
  session,
  suggestion,
  ticket,
  ticketAnswerEmbeddings,
  ticketQuestionEmbeddings,
  tokenUsage,
  userTicket,
  verificationToken,
  vote,
} from '../lib/db/schema';

// Load environment variables
config({
  path: '.env.local',
});

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('⏳ Connecting to database...');
  const connection = postgres(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log('⏳ Starting database reset...');
  console.log(
    'ℹ️ The following tables will be preserved with their data: user, account',
  );

  try {
    // Using a transaction to ensure all operations succeed or fail together
    await db.transaction(async (tx) => {
      console.log(
        '⏳ Deleting data from all tables except user and account...',
      );

      // Disable foreign key checks
      await tx.execute(sql`SET session_replication_role = 'replica';`);

      // Delete data from tables in the correct order to avoid foreign key constraint issues
      // Start with tables that have foreign key dependencies
      console.log('⏳ Deleting data from vote table...');
      await tx.delete(vote);

      console.log('⏳ Deleting data from document_embeddings table...');
      await tx.delete(documentEmbeddings);

      console.log('⏳ Deleting data from suggestion table...');
      await tx.delete(suggestion);

      console.log('⏳ Deleting data from ticket_answer_embeddings table...');
      await tx.delete(ticketAnswerEmbeddings);

      console.log('⏳ Deleting data from ticket_question_embeddings table...');
      await tx.delete(ticketQuestionEmbeddings);

      console.log('⏳ Deleting data from admin_message table...');
      await tx.delete(adminMessage);

      console.log('⏳ Deleting data from admin_chat table...');
      await tx.delete(adminChat);

      console.log('⏳ Deleting data from user_ticket table...');
      await tx.delete(userTicket);

      console.log('⏳ Deleting data from message table...');
      await tx.delete(message);

      console.log('⏳ Deleting data from ticket table...');
      await tx.delete(ticket);

      console.log('⏳ Deleting data from chat table...');
      await tx.delete(chat);

      console.log('⏳ Deleting data from document table...');
      await tx.delete(document);

      console.log('⏳ Deleting data from token_usage table...');
      await tx.delete(tokenUsage);

      console.log('⏳ Deleting data from session table...');
      await tx.delete(session);

      console.log('⏳ Deleting data from verification_token table...');
      await tx.delete(verificationToken);

      console.log('⏳ Deleting data from authenticator table...');
      await tx.delete(authenticator);

      // Re-enable foreign key checks
      await tx.execute(sql`SET session_replication_role = 'origin';`);
    });

    console.log('✅ Database reset completed successfully!');
    console.log(
      'ℹ️ The following tables were preserved with their data: user, account',
    );
  } catch (error) {
    console.error('❌ Database reset failed:', error);
  } finally {
    // Close the database connection
    await connection.end();
    process.exit(0);
  }
}

// Run the function
resetDatabase().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
