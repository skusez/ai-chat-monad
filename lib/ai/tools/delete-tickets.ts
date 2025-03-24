import {
  deleteTicketsByIds,
  getTicketsByIds,
  notifyUsersSubscribedToTicket,
} from '@/lib/db/queries';
import { ragSearch } from '@/lib/db/vector';
import { type DataStreamWriter, tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';

export const resolveTickets = ({
  session,
  dataStream,
}: {
  session: Session;
  dataStream: DataStreamWriter;
}) =>
  tool({
    description:
      'Resolve the tickets and give a reason for resolving the ticket',
    parameters: z.object({
      tickets: z.array(
        z.object({
          ticketId: z.string().describe('The ticketId to delete'),
          resolved: z.boolean().describe('Whether the ticket is resolved'),
        }),
      ),
    }),
    execute: async ({ tickets }) => {
      if (!session.user?.id) {
        throw new Error('User not found');
      }

      dataStream.writeData({
        type: 'getting-tickets',
        content: ``,
      });

      // get the full tickets from the database
      const resolvedTickets = await getTicketsByIds(
        tickets
          .filter((ticket) => ticket.resolved)
          .map((ticket) => ticket.ticketId),
      );

      dataStream.writeData({
        type: 'notifying-users',
        content: ``,
      });

      await Promise.all(
        //   TODO in here, maybe can maintain embeddings for reasons question wasnt answered, so next time the same question doesnt create a ticket
        resolvedTickets.map(async (ticket) => {
          // get the result from the rag search
          const result = await ragSearch({
            query: ticket.question,
            limit: 1,
          });

          if (result.length > 0) {
            //   notify users subscribed to the ticket
            await notifyUsersSubscribedToTicket({
              ticketId: ticket.id,
              //   TODO run the result through LLM to get the reason for deleting the ticket
              result: result[0]?.content || 'Your question went unanswered',
            });
          }
        }),
      );

      dataStream.writeData({
        type: 'deleting-tickets',
        content: ``,
      });

      await deleteTicketsByIds({
        ticketIds: tickets.map((ticket) => ticket.ticketId),
      });

      return {
        content: `Deleted ${resolvedTickets.length} tickets`,
      };
    },
  });
