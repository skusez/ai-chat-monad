import { useState, useEffect } from 'react';
import { FileIcon, LoaderIcon, CheckCircleFillIcon } from './icons';
import { motion } from 'framer-motion';

type CrawlState = 'idle' | 'crawling' | 'finished';

export function SaveInformationDisplay({
  state,
  args,
  result,
}: {
  state: 'call' | 'result';
  args: any;
  result?: any;
}) {
  const [crawlState, setCrawlState] = useState<CrawlState>('idle');
  const [crawlMessage, setCrawlMessage] = useState<string>('');

  useEffect(() => {
    if (state === 'call') {
      if (args.url) {
        setCrawlState('crawling');
        setCrawlMessage(`Crawling ${args.url}...`);
      } else if (args.content) {
        setCrawlState('idle');
        setCrawlMessage('Processing content...');
      }
    } else if (state === 'result') {
      setCrawlState('finished');
      setCrawlMessage('Content added to knowledge base');
    }
  }, [state, args]);

  return (
    <div className="w-fit border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3">
      <div className="flex flex-row gap-3 items-start">
        <div className="text-zinc-500 mt-1">
          <FileIcon />
        </div>

        <div className="flex flex-col">
          <div className="text-left font-medium">
            {args.url ? 'Adding information from URL' : 'Adding information'}
          </div>
          <div className="text-sm text-zinc-500">{crawlMessage}</div>
        </div>
      </div>

      <div className="mt-1">
        {crawlState === 'crawling' && (
          <motion.div className="animate-spin">
            <LoaderIcon />
          </motion.div>
        )}
        {crawlState === 'finished' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircleFillIcon />
          </motion.div>
        )}
      </div>
    </div>
  );
}
