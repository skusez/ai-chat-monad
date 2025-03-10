import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from "ai";

import { auth } from "@/app/(auth)/auth";
import { myProvider } from "@/lib/ai/models";
import { adminSystemPrompt, systemPrompt } from "@/lib/ai/prompts";
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getUser,
} from "@/lib/db/queries";
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "@/lib/utils";

import { generateTitleFromUserMessage } from "../../actions";

import { rateLimitRequest, trackTokenUsage } from "@/lib/redis";
import { CHAT_MODELS_CONFIG } from "@/lib/config";

import { createTicket } from "@/lib/ai/tools/create-ticket";
import { getInformation } from "@/lib/ai/tools/get-information";
import { getTickets } from "@/lib/ai/tools/get-tickets";
import { Chat } from "@/lib/db/schema";
import { addInformation } from "@/lib/ai/tools/add-information";

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
    return new Response("Unauthorized", { status: 401 });
  }

  if (isAdmin) {
    if (session.user.isAdmin !== true) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response("No user message found", { status: 400 });
  }

  // Estimate token count for the request
  // Apply token cost multiplier based on model
  const modelMultiplier =
    CHAT_MODELS_CONFIG.tokenCostMultipliers[
      selectedChatModel as keyof typeof CHAT_MODELS_CONFIG.tokenCostMultipliers
    ] || 1;
  if (!isAdmin) {
    // Get user information including tier
    const userInfo = await getUser(session.user.email || "");
    const userTier = userInfo.length > 0 ? userInfo[0].tier : "free";

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
          headers: { "Content-Type": "application/json" },
        }
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
        role: "user",
      },
    ],
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: isAdmin
          ? // ! 1. engineer the prompt
            // ! 4. ui changes
            adminSystemPrompt
          : systemPrompt({
              selectedChatModel,
            }),
        messages,
        maxSteps: 5,
        experimental_activeTools: isAdmin
          ? ["getInformation", "getTickets", "addInformation"]
          : [
              // "getWeather",
              // "createDocument",
              // "updateDocument",
              // "requestSuggestions",
              "getInformation",
              "createTicket",
            ],
        experimental_transform: smoothStream({ chunking: "word" }),
        experimental_generateMessageId: generateUUID,
        tools: {
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
          addInformation: addInformation({
            session,
          }),
          getTickets: getTickets({
            session,
            dataStream,
          }),
        },
        onFinish: async ({ response, reasoning, usage: { totalTokens } }) => {
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
              console.error("Failed to save chat", error);
            }
          }
        },

        experimental_telemetry: {
          isEnabled: true,
          functionId: "stream-text",
        },
      });

      result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: (e) => {
      console.error("Failed to stream text", e);
      return "Oops, an error occured!";
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = (await getChatById({ id, isAdmin: false })) as Chat;

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id, isAdmin: false });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
