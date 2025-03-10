import { processTicketForEmbedding } from "@/lib/db/vector";
import { tool } from "ai";
import { Session } from "next-auth";
import { z } from "zod";

export const addInformation = ({ session }: { session: Session }) =>
  tool({
    description: "add content to the knowledge base",
    parameters: z.object({
      content: z
        .string()
        .describe("the content to be added to the knowledge base"),
      ticketId: z
        .string()
        .describe("the ticket id associated with the question"),
    }),
    execute: async ({ content, ticketId }) => {
      if (!session.user?.id) {
        throw new Error("User not found");
      }

      const { success } = await processTicketForEmbedding({
        ticketId,
        content,
      });

      if (!success) throw "Could not generate embedding";

      return {
        content:
          "The content was added to the knowledge base, confirm it works by calling \'getInformation\'",
      };
    },
  });
