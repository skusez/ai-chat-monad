import {
  type CoreMessage,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import type { Message } from '@ai-sdk/react';

import { auth } from '@/app/(auth)/auth';
import { aiProvider } from '@/lib/ai/models';
import { adminSystemPrompt, systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getUser,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';

import { rateLimitRequest, trackTokenUsage } from '@/lib/redis';
import { CHAT_MODELS_CONFIG } from '@/lib/config';

import { createTicket } from '@/lib/ai/tools/create-ticket';
import { getInformation } from '@/lib/ai/tools/get-information';
import { getTickets } from '@/lib/ai/tools/get-tickets';
import type { Chat } from '@/lib/db/schema';
import { saveInformation } from '@/lib/ai/tools/save-information';
import { resolveTickets } from '@/lib/ai/tools/resolve-tickets';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';

export const maxDuration = 60;

export async function POST(request: Request) {
  const {
    id,
    messages,
    selectedChatModel,
    isAdmin,
  }: {
    id: string;
    messages: Array<Message>;
    selectedChatModel: string;
    isAdmin: boolean;
  } = await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (isAdmin) {
    if (session.user.isAdmin !== true) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  // Estimate token count for the request
  // Apply token cost multiplier based on model
  const modelMultiplier =
    CHAT_MODELS_CONFIG.tokenCostMultipliers[
      selectedChatModel as keyof typeof CHAT_MODELS_CONFIG.tokenCostMultipliers
    ] || 1;
  if (!isAdmin) {
    // Get user information including tier
    const userInfo = await getUser(session.user.email || '');
    const userTier = userInfo.length > 0 ? userInfo[0].tier : 'free';

    // Check rate limiting
    const rateLimitResult = await rateLimitRequest({
      userId: session.user.id,
      requestTokens: 0,
      userTier,
    });

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: rateLimitResult.reason,
          details: rateLimitResult,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  const chat = await getChatById({ id, isAdmin });
  if (!chat) {
    const title = await generateTitleFromUserMessage({
      message: userMessage,
    });
    await saveChat({ id, userId: session.user.id, title, isAdmin });
  }

  // this is for saving the user message
  await saveMessages({
    isAdmin,
    messages: [
      {
        ...userMessage,
        createdAt: new Date(),
        chatId: id,
        tokenCount: 0,
        role: 'user',
      },
    ],
  });

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const tools = {
        createTicket: createTicket({
          session,
          dataStream,
          chatId: id,
          messageId: userMessage.id,
        }),
        getInformation: getInformation({
          session,
          dataStream,
        }),
        saveInformation: saveInformation({
          session,
          dataStream,
        }),
        getTickets: getTickets({
          session,
          dataStream,
        }),
        resolveTickets: resolveTickets({
          session,
          dataStream,
        }),
        createDocument: createDocument({
          session,
          dataStream,
        }),
        updateDocument: updateDocument({
          session,
          dataStream,
        }),
      };

      const result = streamText({
        model: aiProvider.languageModel(selectedChatModel),
        system: isAdmin
          ? adminSystemPrompt
          : systemPrompt({
              selectedChatModel,
            }),
        messages: messages as CoreMessage[],
        maxSteps: 10,
        experimental_activeTools: isAdmin
          ? [
              'getInformation',
              'getTickets',
              'saveInformation',
              'resolveTickets',
            ]
          : [
              'getInformation',
              'createTicket',
              'createDocument',
              'updateDocument',
            ],
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools,
        onFinish: async ({
          response,
          reasoning,
          usage: { totalTokens },
          steps,
        }) => {
          if (session.user?.id) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });

              if (!isAdmin) {
                // Track token usage for the response
                const responseTokens = totalTokens * modelMultiplier;
                await trackTokenUsage({
                  userId: session.user.id,
                  tokenCount: responseTokens,
                  model: selectedChatModel,
                });
              }

              // this is for saving the ai response messages
              await saveMessages({
                isAdmin,
                messages: sanitizedResponseMessages.map((message) => {
                  return {
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                    tokenCount: totalTokens,
                  };
                }),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        },
      });

      result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        // dont send reasoning for admin panel
        sendReasoning: !isAdmin,
        sendSources: true,
      });
    },
    onError: (e) => {
      console.error('Failed to stream text', e);
      return 'Oops, an error occured!';
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const isAdminPage = searchParams.get('isAdminPage');
  const isAdmin = isAdminPage === 'true';

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = (await getChatById({ id, isAdmin })) as Chat;

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id, isAdmin });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
