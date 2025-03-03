// app/(chat)/api/ticket/create/route.ts
import { auth } from "../../../(auth)/auth";
import { saveChat, saveTicket } from "../../../../lib/db/queries";
import { creditTokens } from "../../../../lib/redis";
import { generateUUID } from "../../../../lib/utils";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId, projectName, projectWebsite } = await request.json();

    if (!documentId) {
      return Response.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    if (!projectName) {
      return Response.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create a new chat
    const chatId = generateUUID();
    await saveChat({
      id: chatId,
      title: `Ticket: ${projectName}`,
      userId: session.user.id,
    });

    // Create the ticket with the project information
    await saveTicket({
      chatId,
      projectName,
      projectWebsite,
      resolved: true,
    });

    // Credit the user with 1000 tokens
    const creditResult = await creditTokens({
      userId: session.user.id,
      amount: 1000,
    });

    return Response.json({
      success: true,
      chatId,
      message: "Ticket created and tokens credited",
      creditResult,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return Response.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
