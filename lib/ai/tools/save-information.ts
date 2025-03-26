import { crawler } from '@/lib/crawler';
import { processTicketAnswerForEmbedding } from '@/lib/db/vector';
import { type DataStreamWriter, tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';

export const saveInformation = ({
  session,
  dataStream,
}: { session: Session; dataStream: DataStreamWriter }) =>
  tool({
    description:
      'add information to the knowledge base by providing the answer or a url to scrape',
    parameters: z.object({
      answerOrUrl: z.string().describe('the answer or a url to scrape'),
      ticketId: z
        .string()
        .uuid()
        .optional()
        .describe('optional ticket id if admin provided it'),
    }),
    execute: async ({ answerOrUrl, ticketId }) => {
      if (!session.user?.id) {
        throw 'User not found';
      }

      // validate the url
      const url = answerOrUrl.startsWith('http') ? answerOrUrl : undefined;

      try {
        if (url) {
          // Return intermediate progress to improve user experience
          // This allows the model to provide meaningful updates during the process
          dataStream?.writeData({
            type: 'processing-status',
            content: `Processing URL: ${url}`,
            toolCallId: 'saveInformation',
          });

          const processedPages = await processCrawlUrl(
            url,
            ticketId,
            dataStream,
          );
          return {
            content: 'The content was added to the knowledge base.',
            processedPages,
            sourceUrl: url,
          };
        } else if (answerOrUrl) {
          dataStream?.writeData({
            type: 'processing-status',
            content: 'Processing content...',
            toolCallId: 'saveInformation',
          });

          const { success } = await createEmbedding(answerOrUrl, ticketId);
          if (!success) throw 'Could not generate embedding';
          return {
            content: 'The content was added to the knowledge base.',
            source: 'direct input',
          };
        } else {
          return 'No content or URL provided to add';
        }
      } catch (error) {
        return typeof error === 'string' ? error : 'Failed to process content';
      }
    },
  });

/**
 * Creates an embedding from the provided content
 */
async function createEmbedding(
  content: string,
  ticketId?: string,
  source?: string,
) {
  return processTicketAnswerForEmbedding({
    ticketId: ticketId || undefined,
    content,
    source,
  });
}

/**
 * Crawls a URL and processes the content for embedding
 */
async function processCrawlUrl(
  url: string,
  ticketId?: string,
  dataStream?: DataStreamWriter,
) {
  // Notify crawl started
  dataStream?.writeData({
    type: 'crawl-started',
    content: 'Starting URL crawl...',
    toolCallId: 'saveInformation',
  });

  // Crawl the URL - Updating parameters to match Firecrawl's expected structure
  const crawlResponse = await crawler.asyncCrawlUrl(url, {
    limit: 10,
    maxDepth: 3,
    // Add includes/excludes if you want to target specific paths
    scrapeOptions: {
      formats: ['markdown'],
      onlyMainContent: true,
    },
  });

  if (!crawlResponse.success || !crawlResponse.id) {
    throw 'Failed to initiate URL crawling';
  }

  // Wait for crawl to complete and provide status updates
  const crawlResult = await waitForCrawlCompletion(
    crawlResponse.id,
    dataStream,
  );

  // Process crawled pages
  dataStream?.writeData({
    type: 'crawl-finished',
    content: `Processing ${crawlResult.total} pages...`,
  });

  if (!crawlResult.data.length) {
    throw 'No content found from the crawled URL';
  }

  console.log(`Processing ${crawlResult.total} pages`);

  // Create embeddings for each page with markdown content
  const results = await Promise.allSettled(
    crawlResult.data.map(async (data) => {
      // Ensure we're accessing the markdown and metadata correctly
      // Based on Firecrawl's response structure
      if (data.markdown) {
        const sourceURL = data.metadata?.sourceURL || url;

        // Log successful extraction
        console.log(`Extracted content from: ${sourceURL}`);

        const { success } = await createEmbedding(
          data.markdown,
          ticketId || undefined,
          sourceURL,
        );
        return success;
      }
      return false;
    }),
  );

  // Count successful embeddings
  const successCount = results.filter(
    (result) => result.status === 'fulfilled' && result.value,
  ).length;

  // Log success summary
  console.log(
    `Created ${successCount} embeddings out of ${results.length} pages`,
  );

  // Success if at least one embedding was created
  const success = successCount > 0;

  if (!success) {
    throw 'Failed to create any embeddings from crawled content';
  }

  return successCount;
}

/**
 * Waits for a crawl to complete, providing status updates
 */
async function waitForCrawlCompletion(
  crawlId: string,
  dataStream?: DataStreamWriter,
) {
  let crawlResult = await crawler.checkCrawlStatus(crawlId);
  if (!crawlResult.success) {
    throw 'Failed to check crawl status';
  }

  let lastTotal = 0;
  let statusCheckCount = 0;
  const maxStatusChecks = 300; // Prevent infinite loops

  while (!crawlResult.completed && statusCheckCount < maxStatusChecks) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Longer interval to reduce API calls

    statusCheckCount++;
    crawlResult = await crawler.checkCrawlStatus(crawlId);

    if (!crawlResult.success) {
      throw 'Failed to check crawl status';
    }

    // Only send update if the total has changed or every 10 checks
    if (crawlResult.total !== lastTotal || statusCheckCount % 10 === 0) {
      dataStream?.writeData({
        type: 'crawl-status',
        content: `Found ${crawlResult.total} pages... (Status: ${crawlResult.status || 'in progress'})`,
      });
      lastTotal = crawlResult.total;
    }
  }

  if (statusCheckCount >= maxStatusChecks && !crawlResult.completed) {
    throw 'Crawl timed out after maximum status checks';
  }

  // Final status update
  dataStream?.writeData({
    type: 'crawl-status',
    content: `Completed crawl with ${crawlResult.total} pages.`,
  });

  return crawlResult;
}
