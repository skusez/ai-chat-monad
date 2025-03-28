import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';

export const aiProvider = customProvider({
  languageModels: {
    'chat-model-medium': groq('deepseek-r1-distill-llama-70b'),
    'chat-model-small': groq('llama3-70b-8192'),
    // 'chat-model-small': openai('gpt-4o-mini'),
  },
  textEmbeddingModels: {
    'text-embedding-3-small': openai.textEmbeddingModel(
      'text-embedding-ada-002',
    ),
  },
});

export const DEFAULT_LANGUAGE_MODEL = 'chat-model-small';
export const ADMIN_DEFAULT_LANGUAGE_MODEL = 'chat-model-small';
export const DEFAULT_TEXT_EMBEDDING_MODEL = 'text-embedding-3-small';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Small model',
    description: 'Small model for fast, lightweight tasks',
  },
];
