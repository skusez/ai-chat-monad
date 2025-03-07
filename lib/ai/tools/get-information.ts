import { ragSearch } from "@/lib/db/vector";
import { DataStreamWriter, tool } from "ai";
import { Session } from "next-auth";
import { z } from "zod";

export const getInformation = ({
  session,
  dataStream,
}: {
  session: Session;
  dataStream: DataStreamWriter;
}) =>
  tool({
    description:
      "get information from your knowledge base to answer the question",
    parameters: z.object({
      question: z.string().describe("the users question"),
    }),
    execute: async ({ question }) => {
      if (!session.user?.id) {
        throw new Error("User not found");
      }

      const [information] = await ragSearch({
        query: question,
        limit: 4,
      });

      if (information) {
        dataStream.writeData({
          type: "information-found",
          content: information.content,
        });
      }

      return {
        content:
          "No information found, use the 'createTicket' tool to create a ticket",
      };
    },
  });
