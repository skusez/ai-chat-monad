import {
  deleteTicketsByIds,
  getTicketsByIds,
  notifyUsersSubscribedToTicket,
} from '@/lib/db/queries';
import { ragSearch } from '@/lib/db/vector';
import { type DataStreamWriter, tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { tryCatch } from '@/lib/utils';

export const resolveTickets = ({
  session,
  dataStream,
}: {
  session: Session;
  dataStream: DataStreamWriter;
}) =>
  tool({
    description: 'Resolve one or more tickets',
    parameters: z.object({
      ticketIds: z.array(z.string()).describe('The ticketIds to resolve'),
    }),
    execute: async ({ ticketIds }) => {
      if (!session.user?.id) {
        throw 'User not found';
      }
      if (!session.user.isAdmin) {
        throw 'Admin permissions required';
      }

      // Convert single ticket ID to array for consistent processing
      const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds];

      if (ids.length === 0) {
        return { error: 'No ticket IDs provided', success: false };
      }

      // Notify client of processing
      dataStream?.writeData({
        type: 'processing-status',
        content: `Resolving ${ids.length} ticket(s)...`,
        toolCallId: 'resolveTickets',
      });

      // get the full tickets from the database
      const [resolvedTickets, error] = await tryCatch(getTicketsByIds(ids));

      if (error) {
        return {
          content: `Failed to resolve tickets: ${error.message}`,
        };
      }

      if (!resolvedTickets) {
        return {
          content: `Ticked ID does not exist`,
        };
      }

      // dataStream.writeData({
      //   type: 'notifying-users',
      //   content: ``,
      // });

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

      // dataStream.writeData({
      //   type: 'deleting-tickets',
      //   content: ``,
      // });

      await deleteTicketsByIds({
        ticketIds: ids,
      });

      return {
        content: `Deleted ${resolvedTickets.length} tickets`,
      };
    },
  });
