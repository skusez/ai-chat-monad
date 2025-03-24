import { useState, useTransition, useOptimistic } from 'react';
import { MessageIcon, TrashIcon } from './icons';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { deleteTicketAction } from '@/artifacts/actions';
import type { UseChatHelpers } from '@ai-sdk/react';

type RawTicket = {
  id: string;
  created_at: string;
  chat_id: string;
  question: string;
  message_id: string;
  updated_at: string;
  resolved: boolean;
};

export function GetTicketsDisplay({
  result,
  append,
}: {
  result: {
    tickets: RawTicket[];
  };
  append: UseChatHelpers['append'];
}) {
  const [isPending, startTransition] = useTransition();
  // Use useState to maintain the base tickets state that won't reset on re-renders
  const [baseTickets, setBaseTickets] = useState(result?.tickets || []);

  // Setup optimistic state using the stable baseTickets state instead of result.tickets
  const [optimisticTickets, addOptimisticTicket] = useOptimistic<
    RawTicket[],
    { action: 'delete'; id: string }
  >(baseTickets, (state, { action, id }) => {
    // Handle different optimistic actions
    if (action === 'delete') {
      return state.filter((ticket) => ticket.id !== id);
    }
    return state;
  });

  // Format date string
  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle ticket deletion with optimistic updates
  const handleDeleteTicket = async (ticketId: string) => {
    // Apply optimistic update immediately
    startTransition(async () => {
      addOptimisticTicket({ action: 'delete', id: ticketId });

      // Perform the actual delete operation
      const result = await deleteTicketAction(ticketId);

      if (result.success) {
        // Update the base tickets state after successful deletion
        setBaseTickets((current) => current.filter((t) => t.id !== ticketId));
        toast.success('Ticket deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete ticket');
      }
    });
  };

  console.log({ optimisticTickets });
  return (
    <div className="w-full border rounded-xl overflow-hidden">
      <div className="bg-muted/50 p-3 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <MessageIcon />
          <span className="font-medium">User Questions</span>
        </div>
        <div className="text-sm text-zinc-500">
          {optimisticTickets.length} question
          {optimisticTickets.length !== 1 ? 's' : ''}
        </div>
      </div>

      {optimisticTickets.length === 0 ? (
        <div className="p-8 flex justify-center items-center text-zinc-500">
          No questions found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Question</th>
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {optimisticTickets.map((ticket) => (
                <tr key={ticket.id} className={`border-t hover:bg-muted/20`}>
                  <td className="px-4 py-3 text-sm font-medium truncate max-w-[300px]">
                    {ticket.question}
                  </td>

                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {ticket.created_at ? formatDate(ticket.created_at) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        append({
                          role: 'user',
                          content: `Lets focus on this question:\n\n${ticket.question}`,
                        });
                      }}
                    >
                      Select
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteTicket(ticket.id)}
                      disabled={isPending}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
