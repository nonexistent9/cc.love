import { redis } from './kv';

export interface PushTokenData {
  token: string;
  deviceId: string | null;
  deviceName: string | null;
  platform: string;
  timestamp?: number;
}

export interface TokenStore {
  tokens: PushTokenData[];
}

const REDIS_KEY = 'push-tokens';

/**
 * Get all stored push tokens from Redis
 */
export async function getStoredTokens(): Promise<TokenStore> {
  try {
    const data = await redis.hgetall(REDIS_KEY);

    if (!data || Object.keys(data).length === 0) {
      return { tokens: [] };
    }

    const tokens: PushTokenData[] = Object.values(data).map((value) => {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value as PushTokenData;
    });

    return { tokens };
  } catch (error) {
    console.error('Error reading tokens from Redis:', error);
    return { tokens: [] };
  }
}

/**
 * Add or update a push token in Redis
 */
export async function upsertToken(tokenData: PushTokenData): Promise<void> {
  try {
    const dataWithTimestamp = {
      ...tokenData,
      timestamp: Date.now(),
    };

    await redis.hset(REDIS_KEY, {
      [tokenData.token]: JSON.stringify(dataWithTimestamp),
    });

    console.log('Token saved to Redis:', tokenData.token);
  } catch (error) {
    console.error('Error saving token to Redis:', error);
    throw error;
  }
}

/**
 * Get all valid Expo push tokens
 */
export async function getAllTokens(): Promise<string[]> {
  const store = await getStoredTokens();
  return store.tokens.map(t => t.token);
}
