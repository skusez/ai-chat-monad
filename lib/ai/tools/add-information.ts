import { Crawl4AI } from "@/lib/crawler";
import { processTicketForEmbedding } from "@/lib/db/vector";
import { tool } from "ai";
import { Session } from "next-auth";
import { z } from "zod";

export const addInformation = ({ session }: { session: Session }) =>
  tool({
    description:
      "The user will have provided text to add, or a URL that we need to scrape. If there is a URL then don't add the content parameter.",
    parameters: z.object({
      content: z
        .string()
        .optional()
        .describe("the content to be added to the knowledge base"),
      ticketId: z
        .string()
        .optional()
        .describe("the ticket id associated with the question (if any)"),
      url: z
        .string()
        .url()
        .optional()
        .describe("the URL the user provided (if any)"),
    }),
    execute: async ({ content, ticketId, url }) => {
      if (!session.user?.id) {
        throw new Error("User not found");
      }

      console.log({ url });

      let contentToAdd = content;

      if (url) {
        // crawl the url for content
        const crawler = new Crawl4AI();
        const taskId = await crawler.crawl({ urls: [url] });

        let attempts = 0;
        let status = "pending"; // Initial status
        const maxAttempts = 10;

        while (status !== "completed" && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
          try {
            const result = await crawler.getTaskResult({
              taskId,
              format: "markdown",
            });

            status = result.status;

            if (result.result?.markdown) {
              contentToAdd = result.result.markdown;
              console.log(
                "Crawled content:",
                contentToAdd.substring(0, 100) + "..."
              );
            }
          } catch (error) {
            console.error("Error fetching task result:", error);
          }

          attempts++;
        }

        if (status !== "completed" || !contentToAdd) {
          throw new Error("Failed to crawl the URL or extract content");
        }
      }

      if (!contentToAdd) {
        throw "Could not get any content to add";
      }
      // handle content case
      const { success } = await processTicketForEmbedding({
        ticketId,
        content: contentToAdd,
        source: url,
      });

      if (!success) throw "Could not generate embedding";

      return {
        content:
          "The content was added to the knowledge base, confirm it works by calling \'getInformation\'",
      };
    },
  });
