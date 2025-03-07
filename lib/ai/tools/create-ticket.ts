import { addUserToTicket, saveTicket } from "@/lib/db/queries";
import { searchSimilarTickets } from "@/lib/db/vector";
import { DataStreamWriter, tool } from "ai";
import { Session } from "next-auth";
import { z } from "zod";

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
      "Create a ticket for the users question if a similar ticket is not already created",
    parameters: z.object({
      question: z.string().describe("The question the user asked"),
    }),
    execute: async ({ question }) => {
      if (!session.user?.id) {
        throw new Error("User not found");
      }

      let ticketId: string | undefined;

      // 1. check if a similar unanswered question exists
      const [existingTicket] = await searchSimilarTickets({
        query: question,
        limit: 1,
      });

      // 2. if it does, add this user to the ticket
      if (existingTicket) {
        dataStream.writeData({
          type: "ticket-exists",
          content: existingTicket.question,
        });

        await addUserToTicket({
          userId: session.user.id,
          ticketId: existingTicket.id,
        });

        ticketId = existingTicket.id;
      } else {
        dataStream.writeData({
          type: "ticket-created",
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

      // 4. write the finish event
      dataStream.writeData({
        type: "finish",
        content: "",
      });

      return {
        ticketId,
        content:
          "A ticket was created and the user will be notified once someone from the team answers the question.",
      };
    },
  });
