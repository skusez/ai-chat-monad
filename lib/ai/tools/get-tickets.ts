import { DataStreamWriter, generateObject, tool } from "ai";
import { Session } from "next-auth";
import { z } from "zod";

import { postgresPrompt } from "../prompts";
import { openai } from "@ai-sdk/openai";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);
export const getTickets = ({
  session,
  dataStream,
}: {
  session: Session;
  dataStream: DataStreamWriter;
}) =>
  tool({
    description:
      "search the database for questions (tickets) based on the users prompt",
    parameters: z.object({
      prompt: z
        .string()
        .describe("the initial prompt eg. show me the 5 most recent questions"),
    }),

    execute: async ({ prompt }) => {
      if (!session.user?.isAdmin) {
        throw new Error("User is not admin");
      }

      const {
        object: { query },
      } = await generateObject({
        model: openai("gpt-4o"),
        schema: z.object({ query: z.string() }),
        system: postgresPrompt,
        prompt,
      });

      // TODO this should be a structured result containing the ticket schema

      const result = await db.execute(query);

      return result;
    },
  });
