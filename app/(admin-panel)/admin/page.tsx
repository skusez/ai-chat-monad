import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_LANGUAGE_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelId =
    cookieStore.get('chat-model')?.value || DEFAULT_LANGUAGE_MODEL;

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        isAdmin={true}
        selectedChatModel={modelId}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
