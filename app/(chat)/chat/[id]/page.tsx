import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_LANGUAGE_MODEL } from '@/lib/ai/models';
import type { UIMessage } from '@ai-sdk/ui-utils';
import { setChatAnswerRead } from '@/lib/redis';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id, isAdmin: false });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (chat.visibility === 'private') {
    if (!session) {
      return notFound();
    }

    if (session.user?.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
    isAdmin: false,
  });

  const cookieStore = await cookies();
  const chatModelId =
    cookieStore.get('chat-model')?.value || DEFAULT_LANGUAGE_MODEL;

  // Mark chat as read by removing it from Redis when the owner views it
  if (session?.user?.id === chat.userId) {
    setChatAnswerRead({
      userId: chat.userId,
      chatId: id,
    }).catch((e) => console.error('Failed to mark chat as read:', e));
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb) as UIMessage[]}
        selectedChatModel={chatModelId}
        selectedVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
