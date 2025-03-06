// the brief creates a document that is viewable by the admin. It should show key details about the project.

import { documentHandlersByArtifactKind } from "@/lib/artifacts/server";
import { saveBrief } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";
import { DataStreamWriter, tool } from "ai";
import { Session } from "next-auth";
import { z } from "zod";

interface CreateBriefProps {
  session: Session;
  dataStream: DataStreamWriter;
  chatId: string;
}

export const socialMediaPlanSchema = z
  .object({
    platform: z
      .enum(["twitter", "telegram", "discord", "github"])
      .describe("The platform the user wants to increase their engagement on"),
    link: z
      .string()
      .describe(
        "The URL pointing to the social media platform eg 'https://x.com/projectname'"
      ),
    frequency: z
      .string()
      .describe("The posting frequency eg 'two times a day'"),
    targetAudience: z
      .string()
      .describe(
        "The target audience the project is trying to reach eg 'developers'"
      ),
  })
  .describe("The social media marketing plan for the project");

export type SocialMediaPlan = z.infer<typeof socialMediaPlanSchema>;

export const createBrief = ({
  session,
  dataStream,
  chatId,
}: CreateBriefProps) =>
  tool({
    description:
      "Use this tool to create a brief for a project based on the user's input.",
    parameters: z.object({
      name: z.string().describe("The name of the project"),
      description: z.string().describe("A short description of the project"),
      website: z
        .string()
        .optional()
        .describe("The URL of the project's website if it exists"),
      socialMediaPlan: z
        .array(socialMediaPlanSchema)
        .describe(
          "Array of social media marketing plans. At least one must be present."
        ),
      timeline: z
        .string()
        .describe(
          "The current state of the users project eg 'planning' or 'marketing'"
        ),
    }),
    execute: async ({
      description,
      socialMediaPlan,
      timeline,
      name,
      website,
    }) => {
      console.log("before session.user?.id");

      if (!session.user?.id) {
        throw new Error("User not found");
      }

      const id = generateUUID();

      console.log("before save brief");

      await saveBrief({
        id,
        name,
        description,
        socialMediaPlan,
        timeline,
        chatId,
        website,
        userId: session.user.id,
      });

      console.log("after save brief");

      await documentHandlersByArtifactKind
        .find((handler) => handler.kind === "text")
        ?.onCreateDocument({
          dataStream,
          id,
          session,
          title: `Brief for ${name}`,
        });
      dataStream.writeData({ type: "finish", content: "" });

      return {
        id,
        title: `Brief for ${name}`,
        kind: "text",
        content: "A document was created and is now visible to the user.",
      };
    },
  });
