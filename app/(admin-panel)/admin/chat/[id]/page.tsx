import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_LANGUAGE_MODEL } from '@/lib/ai/models';

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

  const cookieStore = await cookies();
  const chatModelId =
    cookieStore.get('chat-model')?.value || DEFAULT_LANGUAGE_MODEL;

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={chatModelId}
        selectedVisibilityType={'private'}
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
