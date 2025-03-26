import { createClient } from '@redis/client';
import { REDIS_CONFIG, TOKEN_LIMITS } from './config';

// Initialize Redis client
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set');
}
const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.connect().catch((err) => {
  console.error('Redis connection error:', err);
});

// Function to track token usage
export async function trackTokenUsage({
  userId,
  tokenCount,
  model,
}: {
  userId: string;
  tokenCount: number;
  model: string;
}) {
  try {
    const key = `${REDIS_CONFIG.tokenUsagePrefix}${userId}`;
    const currentUsage = await redis.get(key);

    // If no usage record exists, create a new one
    if (!currentUsage) {
      await redis.set(key, tokenCount);
      await redis.expire(key, REDIS_CONFIG.tokenUsageExpiration);
      return { success: true, currentUsage: tokenCount };
    }

    // Update existing usage record
    const newUsage = Number.parseInt(currentUsage) + tokenCount;
    await redis.set(key, newUsage);

    return { success: true, currentUsage: newUsage };
  } catch (error) {
    console.error('Failed to track token usage', error);
    return { success: false, error };
  }
}

// Function to check if user has exceeded their token limit
export async function checkTokenLimit({
  userId,
  userTier = 'free',
}: {
  userId: string;
  userTier?: 'free' | 'premium';
}) {
  try {
    const key = `${REDIS_CONFIG.tokenUsagePrefix}${userId}`;
    const currentUsage = await redis.get(key);

    if (!currentUsage) {
      return { hasExceededLimit: false, currentUsage: 0 };
    }

    const limit =
      userTier === 'premium'
        ? TOKEN_LIMITS.premiumDailyLimit
        : TOKEN_LIMITS.defaultDailyLimit;

    const usage = Number.parseInt(currentUsage);

    return {
      hasExceededLimit: usage >= limit,
      currentUsage: usage,
      limit,
      remaining: Math.max(0, limit - usage),
    };
  } catch (error) {
    console.error('Failed to check token limit', error);
    // Default to allowing the request in case of error
    return { hasExceededLimit: false, error };
  }
}

// Function to implement rate limiting
export async function rateLimitRequest({
  userId,
  requestTokens,
  userTier = 'free',
}: {
  userId: string;
  requestTokens: number;
  userTier?: 'free' | 'premium';
}) {
  try {
    // Check if the user has exceeded their token limit
    const {
      hasExceededLimit,
      currentUsage = 0,
      limit,
      remaining,
    } = await checkTokenLimit({
      userId,
      userTier,
    });

    if (hasExceededLimit) {
      return {
        allowed: false,
        reason: 'Token limit exceeded',
        currentUsage,
        limit,
      };
    }

    // Check if this request would exceed the limit
    if (remaining && requestTokens > remaining) {
      return {
        allowed: false,
        reason: 'Request would exceed token limit',
        currentUsage,
        limit,
        remaining,
      };
    }

    // Check if the request exceeds the max tokens per request
    if (requestTokens > TOKEN_LIMITS.maxTokensPerRequest) {
      return {
        allowed: false,
        reason: 'Request exceeds maximum tokens per request',
        maxTokensPerRequest: TOKEN_LIMITS.maxTokensPerRequest,
      };
    }

    return {
      allowed: true,
      currentUsage,
      limit,
      remaining: remaining ? remaining - requestTokens : undefined,
    };
  } catch (error) {
    console.error('Failed to rate limit request', error);
    // Default to allowing the request in case of error
    return { allowed: true, error };
  }
}

// Function to reset token usage (for testing or admin purposes)
export async function resetTokenUsage(userId: string) {
  try {
    const key = `${REDIS_CONFIG.tokenUsagePrefix}${userId}`;
    await redis.del(key);
    return { success: true };
  } catch (error) {
    console.error('Failed to reset token usage', error);
    return { success: false, error };
  }
}

// Function to credit tokens to user (for tickets and promotions)
export async function creditTokens({
  userId,
  amount = 1000,
}: {
  userId: string;
  amount?: number;
}) {
  try {
    const key = `${REDIS_CONFIG.tokenUsagePrefix}${userId}`;
    const currentUsage = await redis.get(key);

    if (!currentUsage) {
      // If no usage exists, set it to 0 (fully credited)
      await redis.set(key, 0);
      await redis.expire(key, REDIS_CONFIG.tokenUsageExpiration);
      return { success: true, newUsage: 0 };
    }

    // Calculate new usage (subtracting credits, min value is 0)
    const usage = Number.parseInt(currentUsage);
    const newUsage = Math.max(0, usage - amount);

    // Update the usage
    await redis.set(key, newUsage);

    return {
      success: true,
      previousUsage: usage,
      newUsage,
      creditAmount: usage - newUsage, // Actual amount credited (may be less than amount if usage was < amount)
    };
  } catch (error) {
    console.error('Failed to credit tokens', error);
    return { success: false, error };
  }
}

export default redis;

export async function getChatNotificationsByUserId({
  userId,
}: {
  userId: string;
}) {
  try {
    const key = `${REDIS_CONFIG.chatNotificationsPrefix}${userId}`;
    const notifications = await redis.hGetAll(key);
    console.log('notifications', notifications);
    return notifications;
  } catch (error) {
    console.error('Failed to get chat notifications', error);
    return null;
  }
}

export async function setChatAnswerRead({
  userId,
  chatId,
}: { userId: string; chatId: string }) {
  try {
    const key = `${REDIS_CONFIG.chatNotificationsPrefix}${userId}`;
    // Simply delete the entry when chat is read to keep Redis storage minimal
    const result = await redis.hDel(key, chatId);
    console.log('result', result);
    return { success: true };
  } catch (error) {
    console.error('Failed to set chat answer read', JSON.stringify(error));
    return { success: false, error };
  }
}

export async function setChatNotification({
  userId,
  chatId,
}: {
  userId: string;
  chatId: string;
}) {
  try {
    const key = `${REDIS_CONFIG.chatNotificationsPrefix}${userId}`;
    // Only set to 1 to indicate unread - presence in hash means unread
    await redis.hSet(key, chatId, '1');
    return { success: true };
  } catch (error) {
    console.error('Failed to set chat notification', JSON.stringify(error));
    return { success: false, error };
  }
}
