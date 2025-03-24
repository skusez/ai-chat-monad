import { auth } from '@/app/(auth)/auth';
import { getChatsByUserId } from '@/lib/db/queries';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  const url = new URL(req.url);
  const isAdmin = url.searchParams.get('isAdminPage') === 'true';

  if (!session || !session.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  // biome-ignore lint: Forbidden non-null assertion.
  const chats = await getChatsByUserId({ id: session.user.id!, isAdmin });
  return Response.json(chats);
}
