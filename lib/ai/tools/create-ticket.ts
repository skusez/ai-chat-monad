import { tool, DataStreamWriter } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { documentHandlersByArtifactKind } from "../../artifacts/server";

interface CreateTicketProps {
  session: Session | null;
  dataStream: DataStreamWriter;
  chatId: string;
}

/**
 * Creates a ticket when the AI doesn't have enough context to answer a question
 */
export const createTicket = ({
  session,
  dataStream,
  chatId,
}: CreateTicketProps) =>
  tool({
    description:
      "Creates a ticket when there's insufficient context to answer a question",
    parameters: z.object({
      title: z.string().describe("The title of the ticket"),
    }),
    execute: async ({ title }) => {
      try {
        if (!session?.user?.id) {
          dataStream.writeData({
            type: "error",
            content: "You must be logged in to create a ticket.",
          });
          return { success: false, error: "User not authenticated" };
        }

        dataStream.writeData({
          type: "id",
          content: chatId,
        });

        const documentHandler = documentHandlersByArtifactKind.find(
          (documentHandlerByArtifactKind) =>
            documentHandlerByArtifactKind.kind === "ticket"
        );
        // Use the ticket document handler to create the ticket content
        await documentHandler?.onCreateDocument({
          id: chatId,
          title,
          dataStream,
          session,
        });

        dataStream.writeData({ type: "finish", content: "" });

        return {
          id: chatId,
          title: "Request to create ticket",
          kind: "ticket",
          content:
            "A request to create a ticket was made. The user will now fill out the form.",
        };
      } catch (error) {
        console.error("Error creating ticket:", error);
        dataStream.writeData({
          type: "error",
          content: "Failed to create ticket. Please try again later.",
        });
        return { success: false, error };
      }
    },
  });
