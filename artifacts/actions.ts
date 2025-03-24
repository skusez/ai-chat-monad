'use server';

import {
  deleteTicketsByIds,
  getSuggestionsByDocumentId,
} from '@/lib/db/queries';

export async function getSuggestions({ documentId }: { documentId: string }) {
  const suggestions = await getSuggestionsByDocumentId({ documentId });
  return suggestions ?? [];
}

import { revalidatePath } from 'next/cache';

export async function deleteTicketAction(ticketId: string) {
  try {
    await deleteTicketsByIds({ ticketIds: [ticketId] });
    // Revalidate the path to update any other components that might display this data
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete ticket:', error);
    return { success: false, error: 'Failed to delete ticket' };
  }
}
