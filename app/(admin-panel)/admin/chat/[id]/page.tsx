import { redirect } from 'next/navigation';

import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import type { UseChatHelpers } from '@ai-sdk/react';
import { ADMIN_DEFAULT_LANGUAGE_MODEL } from '@/lib/ai/models';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id, isAdmin: true });

  if (!chat) {
    redirect('/admin');
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
    isAdmin: true,
  });

  const chatModelId = ADMIN_DEFAULT_LANGUAGE_MODEL;

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={
          convertToUIMessages(messagesFromDb) as UseChatHelpers['messages']
        }
        selectedChatModel={chatModelId}
        selectedVisibilityType={'private'}
        isReadonly={false}
        isAdmin={true}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
