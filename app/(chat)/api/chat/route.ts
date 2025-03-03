import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from "ai";

import { auth } from "@/app/(auth)/auth";
import { myProvider } from "@/lib/ai/models";
import { systemPrompt } from "@/lib/ai/prompts";
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
  estimateTokenCount,
} from "@/lib/utils";

import { generateTitleFromUserMessage } from "../../actions";
import { createDocument } from "@/lib/ai/tools/create-document";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { createTicket } from "@/lib/ai/tools/create-ticket";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { searchSimilarDocuments } from "@/lib/db/vector";
import { rateLimitRequest, trackTokenUsage } from "@/lib/redis";
import { CHAT_MODELS_CONFIG } from "@/lib/config";

export const maxDuration = 60;

export async function POST(request: Request) {
  const {
    id,
    messages,
    selectedChatModel,
  }: { id: string; messages: Array<Message>; selectedChatModel: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response("No user message found", { status: 400 });
  }

  // Estimate token count for the request
  const estimatedTokens = estimateTokenCount(messages);

  // Get user information including tier
  const userInfo = await getUser(session.user.email || "");
  const userTier = userInfo.length > 0 ? userInfo[0].tier : "free";

  // Apply token cost multiplier based on model
  const modelMultiplier =
    CHAT_MODELS_CONFIG.tokenCostMultipliers[
      selectedChatModel as keyof typeof CHAT_MODELS_CONFIG.tokenCostMultipliers
    ] || 1;
  const adjustedTokens = estimatedTokens * modelMultiplier;

  // Check rate limiting
  const rateLimitResult = await rateLimitRequest({
    userId: session.user.id,
    requestTokens: adjustedTokens,
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

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  await saveMessages({
    messages: [
      {
        ...userMessage,
        createdAt: new Date(),
        chatId: id,
        tokenCount: estimatedTokens,
      },
    ],
  });

  // Perform RAG to get relevant context
  let context = "";
  try {
    const similarDocuments = await searchSimilarDocuments({
      query: userMessage.content.toString(),
    });
    if (similarDocuments && similarDocuments.length > 0) {
      context = similarDocuments.map((doc: any) => doc.content).join("\n\n");
    }
  } catch (error) {
    console.error("Error retrieving context for RAG:", error);
    // Continue without context if there's an error
  }

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({
          selectedChatModel,
          context, // Pass the RAG context to the system prompt
        }),
        messages,
        maxSteps: 5,
        experimental_activeTools:
          selectedChatModel === "chat-model-reasoning"
            ? []
            : [
                "getWeather",
                "createDocument",
                "updateDocument",
                "requestSuggestions",
                "createTicket",
              ],
        experimental_transform: smoothStream({ chunking: "word" }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
          createTicket: createTicket({
            session,
            dataStream,
            chatId: id,
          }),
        },
        onFinish: async ({ response, reasoning }) => {
          if (session.user?.id) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });

              // Track token usage for the response
              const responseTokens =
                estimateTokenCount(sanitizedResponseMessages) * modelMultiplier;
              await trackTokenUsage({
                userId: session.user.id,
                tokenCount: responseTokens,
                model: selectedChatModel,
              });

              await saveMessages({
                messages: sanitizedResponseMessages.map((message) => {
                  return {
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                    tokenCount: estimateTokenCount([message]),
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
    onError: () => {
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
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
