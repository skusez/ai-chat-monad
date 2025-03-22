import { ragSearch } from '@/lib/db/vector';
import { type DataStreamWriter, tool } from 'ai';
import type { Session } from 'next-auth';
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
      'get information from your knowledge base to answer the question. Transform any questions to statements to optimize rag performance.',
    parameters: z.object({
      query: z.string().describe('the users question in statement form.'),
    }),
    execute: async ({ query }) => {
      if (!session.user?.id) {
        throw new Error('User not found');
      }

      const [information] = await ragSearch({
        query,
        limit: 4,
      });

      if (!information) {
        return 'No information was found. Continue with the next step.';
      }

      console.log('information', information);

      return information;
    },
  });
