// app/(chat)/api/tickets/[id]/route.ts
import { auth } from "../../../../(auth)/auth";
import { getTicketByChatId } from "../../../../../lib/db/queries";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = params.id;
    const ticket = await getTicketByChatId({ chatId: id });

    if (!ticket) {
      return Response.json({ error: "Ticket not found" }, { status: 404 });
    }

    return Response.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return Response.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}
