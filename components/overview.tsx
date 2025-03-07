import { motion } from "framer-motion";
import Link from "next/link";

import { MessageIcon } from "./icons";
import { BLOCKCHAIN_CONFIG } from "@/lib/config";

export const Overview = ({ isAdminPage }: { isAdminPage: boolean }) => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <span>+</span>
          <MessageIcon size={32} />
        </p>
        {isAdminPage ? (
          <>
            This chatbot will help you answer questions from users. You can
            select a question from the sidebar, or use the chat here to answer
            the question. Once a question is answered, the question will be
            removed and the answer will be added to the AI knowledge base.
          </>
        ) : (
          <p>
            Say hello to your personal{" "}
            <Link
              className="font-medium underline underline-offset-4"
              href={BLOCKCHAIN_CONFIG.ecosystemUrl}
              target="_blank"
            >
              growth hacking guru
            </Link>{" "}
            agent designed to elevate your web3 marketing strategy within the{" "}
            <Link
              className="font-medium underline underline-offset-4"
              href={BLOCKCHAIN_CONFIG.ecosystemUrl}
              target="_blank"
            >
              {BLOCKCHAIN_CONFIG.ecosystemName} ecosystem
            </Link>
            . This chatbot leverages dynamic tools to provide you with expert
            insights and strategies.
          </p>
        )}
      </div>
    </motion.div>
  );
};
