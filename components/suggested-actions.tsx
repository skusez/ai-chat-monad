'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import type { CreateMessage, Message } from '@ai-sdk/react';
import { memo } from 'react';
import { BLOCKCHAIN_CONFIG } from '@/lib/config';
import type { ChatRequestOptions } from 'ai';

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isAdminPage: boolean;
}

function PureSuggestedActions({
  chatId,
  append,
  isAdminPage,
}: SuggestedActionsProps) {
  const suggestedActions = isAdminPage
    ? [
        {
          title: 'Show me the 10 oldest questions',
          action: `Get the 10 oldest questions`,
          label: 'oldest',
        },
        {
          title: 'Get the most asked question today',
          action: `Get the question that has been asked the most in the last 24 hours`,
          label: "that hasn't been answered yet",
        },
        {
          title: 'Show me the oldest unresolved question',
          action: `Get the oldest unresolved question`,
          label: 'oldest unresolved',
        },
      ]
    : [
        {
          title: 'Get the attention of KOLs',
          label: `in the ${BLOCKCHAIN_CONFIG.ecosystemName} ecosystem`,
          action: `How do I get the attention of KOLs in the ${BLOCKCHAIN_CONFIG.ecosystemName} ecosystem?`,
        },
        {
          title: 'Setup my discord server',
          label: 'for my community',
          action: 'How can I setup my discord server for my community?',
        },
        {
          title: 'Help me write a marketing strategy',
          label: 'for my project',
          action: 'Help me write a marketing strategy for my project',
        },
        {
          title: 'What are the current trends',
          label: 'in web3 marketing?',
          action: 'What are the current trends in web3 marketing?',
        },
      ];

  return (
    <div className="grid sm:grid-cols-2 gap-2 w-full">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              if (isAdminPage) {
                window.history.replaceState({}, '', `/admin/chat/${chatId}`);
              } else {
                window.history.replaceState({}, '', `/chat/${chatId}`);
              }

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-semibold">{suggestedAction.title}</span>
            <span>{suggestedAction.label}</span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
