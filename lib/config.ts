// Configuration file for the AI chatbot application

import { DEFAULT_LANGUAGE_MODEL } from './ai/models';

// Blockchain ecosystem settings
export const BLOCKCHAIN_CONFIG = {
  ecosystemName: 'Monad', // Name of the blockchain ecosystem
  ecosystemUrl: 'https://monad.xyz',
  description:
    'A high-performance blockchain ecosystem focused on scalability and security who is looking to onboard high quality projects',
};

// Token usage limits
export const TOKEN_LIMITS = {
  // Default token limit per user per day
  defaultDailyLimit: 100000,
  // Premium tier token limit per user per day
  premiumDailyLimit: 500000,
  // Maximum tokens per request
  maxTokensPerRequest: 5000,
  // Rate limiting window in seconds (24 hours)
  rateLimitWindow: 86400,
};

// Vector database configuration
export const VECTOR_DB_CONFIG = {
  // Dimension of the vector embeddings
  vectorDimension: 1536,
  // Similarity threshold for RAG queries
  similarityThreshold: 0.9,
  // Maximum number of results to return from vector search
  maxResults: 5,
};

// Redis configuration
export const REDIS_CONFIG = {
  // Prefix for token usage keys
  tokenUsagePrefix: 'token_usage:',
  // Expiration time for token usage records (24 hours in seconds)
  tokenUsageExpiration: 86400,
  // Key for storing rate limit information
  rateLimitKey: 'rate_limit:',
  // Prefix for chat notifications
  chatNotificationsPrefix: 'chat_notifications:',
};

// Chat models configuration
export const CHAT_MODELS_CONFIG = {
  // Default chat model to use
  defaultModel: DEFAULT_LANGUAGE_MODEL,
  // Token cost multipliers for different models
  tokenCostMultipliers: {
    'chat-model-small': 1,
    'chat-model-medium': 2,
    'chat-model-reasoning': 3,
  },
};
