"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ChatRequestOptions, CreateMessage, Message } from "ai";
import { memo } from "react";
import { BLOCKCHAIN_CONFIG } from "@/lib/config";

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: "Get the attention of KOLs",
      label: `in the ${BLOCKCHAIN_CONFIG.ecosystemName} ecosystem`,
      action: `How do I get the attention of KOLs in the ${BLOCKCHAIN_CONFIG.ecosystemName} ecosystem?`,
    },
    {
      title: "Setup my discord server",
      label: "for my community",
      action: "How can I setup my discord server for my community?",
    },
    {
      title: "Help me write a marketing strategy",
      label: "for my project",
      action: "Help me write a marketing strategy for my project",
    },
    {
      title: "What are the current trends",
      label: "in web3 marketing?",
      action: "What are the current trends in web3 marketing?",
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
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, "", `/chat/${chatId}`);

              append({
                role: "user",
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
