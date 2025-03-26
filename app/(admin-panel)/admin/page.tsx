import { Chat } from '@/components/chat';
import { ADMIN_DEFAULT_LANGUAGE_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page() {
  const id = generateUUID();
  const modelId = ADMIN_DEFAULT_LANGUAGE_MODEL;

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
