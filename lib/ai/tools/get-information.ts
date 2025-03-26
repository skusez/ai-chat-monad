import { ragSearch } from '@/lib/db/vector';
import { type DataStreamWriter, tool } from 'ai';
import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export const getInformation = ({
  session,
  dataStream,
}: {
  session: Session;
  dataStream: DataStreamWriter;
}) =>
  tool({
    description:
      'get information from our knowledge base to answer the question.',
    parameters: z.object({
      question: z.string().describe('the question optimized for rag search.'),
    }),
    execute: async ({ question }) => {
      if (!session.user?.id) {
        redirect('/api/auth/signin');
      }

      dataStream.writeData({
        type: 'text',
        text: 'Searching for information...',
      });

      const [information] = await ragSearch({
        query: question,
        limit: 4,
      });

      if (!information) {
        return {
          content: 'No information was found.',
        };
      }

      return {
        content: {
          ticketId: information.ticketId,
          answer: information.content,
          source: information.source,
        },
      };
    },
  });
