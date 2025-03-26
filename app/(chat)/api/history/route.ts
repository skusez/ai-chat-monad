import { auth } from '@/app/(auth)/auth';
import { getChatsByUserId } from '@/lib/db/queries';
import { getChatNotificationsByUserId } from '@/lib/redis';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  const url = new URL(req.url);
  const isAdmin = url.searchParams.get('isAdminPage') === 'true';

  if (!session || !session.user?.id) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const [chats, chatNotifications] = await Promise.all([
    getChatsByUserId({ id: session.user.id, isAdmin }),
    getChatNotificationsByUserId({ userId: session.user.id }),
  ]);

  // Process all chats and check if they have unread notifications
  const chatsWithReadStatus = chats.map((chat) => {
    // If the chat ID exists in the notifications hash, it's unread
    // biome-ignore lint/complexity/useOptionalChain: <explanation>
    const isAnswerRead = !(chatNotifications && chatNotifications[chat.id]);

    return {
      ...chat,
      isAnswerRead,
    };
  });

  return Response.json(chatsWithReadStatus);
}
