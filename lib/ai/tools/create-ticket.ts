import { addUserToTicket, saveTicket } from '@/lib/db/queries';
import { searchSimilarTicketQuestions } from '@/lib/db/vector';
import { type DataStreamWriter, tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';

export const createTicket = ({
  session,
  dataStream,
  chatId,
  messageId,
}: {
  session: Session;
  dataStream: DataStreamWriter;
  chatId: string;
  messageId: string;
}) =>
  tool({
    description:
      'Create a ticket for the users question if a similar ticket is not already created',
    parameters: z.object({
      question: z.string().describe('The question the user asked'),
    }),
    execute: async ({ question }) => {
      if (!session.user?.id) {
        throw new Error('User not found');
      }

      let ticketId: string | undefined;

      // 1. check if a similar unanswered question exists
      const [existingTicket] = await searchSimilarTicketQuestions({
        query: question,
        limit: 1,
      });

      console.log('existingTicket', existingTicket);

      // 2. if it does, add this user to the ticket
      if (existingTicket) {
        dataStream.writeData({
          type: 'ticket-exists',
          content: existingTicket.content,
        });

        if (existingTicket.ticketId) {
          await addUserToTicket({
            userId: session.user.id,
            ticketId: existingTicket.ticketId,
            chatId,
          });
        }
        ticketId = existingTicket.id;

        return {
          ticketId,
          content:
            'No content was found and a ticket already exists. Let the user know that there is already a similar ticket created for this question. They will be notified once someone from the team answers the question.',
        };
      } else {
        dataStream.writeData({
          type: 'ticket-created',
          content: question,
        });

        // 3. if it doesn't, create a new ticket
        const newTicket = await saveTicket({
          question,
          chatId,
          userId: session.user.id,
          messageId: messageId,
        });

        ticketId = newTicket.id;
      }

      return {
        ticketId,
        content:
          'No content was found and a ticket was created. Let the user know that a ticket was created and they will be notified once someone from the team answers the question.',
      };
    },
  });
