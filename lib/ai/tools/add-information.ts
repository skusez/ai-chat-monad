import { crawler } from '@/lib/crawler';
import { processTicketAnswerForEmbedding } from '@/lib/db/vector';
import { type DataStreamWriter, tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';

export const addInformation = ({
  session,
  dataStream,
}: { session: Session; dataStream: DataStreamWriter }) =>
  tool({
    description:
      'If the user provided a URL, fill in the "url" parameter. If the user provided a text context, fill in the "content" parameter.',
    parameters: z.object({
      content: z
        .string()
        .optional()
        .describe('the content to be added to the knowledge base'),
      ticketId: z
        .string()
        .optional()
        .describe('the ticket id associated with the question (if any)'),
      url: z
        .string()
        .url()
        .optional()
        .describe('the URL the user provided (if any)'),
    }),
    execute: async ({ content, ticketId, url }) => {
      if (!session.user?.id) {
        throw 'User not found';
      }

      console.log({ url });

      let contentToAdd = content;
      let success = false;
      if (url) {
        dataStream.writeData({
          type: 'crawl-started',
          content: '',
          toolCallId: 'add-information',
        });
        // crawl the url for content
        const crawlResponse = await crawler.crawlUrl(url, {
          limit: 100,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        });

        if (!crawlResponse.success) {
          throw 'Crawl failed';
        }

        dataStream.writeData({
          type: 'crawl-finished',
          content: `Crawled ${crawlResponse.data.length} urls`,
        });

        contentToAdd = crawlResponse.data
          .map((data) => data.markdown)
          .join('\n');

        if (!contentToAdd) {
          throw 'Could not get any content to add';
        }

        console.log(`Processing ${crawlResponse.data.length} urls`);

        const results = await Promise.allSettled(
          crawlResponse.data.map(async (data) => {
            console.log(
              `Processing ${data.metadata?.sourceURL}, has markdown: ${!!data.markdown}`,
            );
            if (data.markdown) {
              const { success: successEmbedding } =
                await processTicketAnswerForEmbedding({
                  ticketId,
                  content: data.markdown ?? '',
                  source: data.metadata?.sourceURL,
                });

              return successEmbedding;
            }
          }),
        );

        // let success be true if at least one embedding was created
        success = results.some((result) => result.status === 'fulfilled');
      } else {
        if (!contentToAdd) {
          throw 'Could not get any content to add';
        }
        const { success: successEmbedding } =
          await processTicketAnswerForEmbedding({
            ticketId,
            content: contentToAdd,
            source: url,
          });

        success = successEmbedding;
      }

      if (!success) throw 'Could not generate embedding';

      return {
        content: 'The content was added to the knowledge base.',
      };
    },
  });
