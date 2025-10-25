import fs from 'fs';
import path from 'path';

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

// Store tokens in project root (in production, use a database)
const TOKENS_FILE = path.join(process.cwd(), 'push-tokens.json');

/**
 * Get all stored push tokens from file
 */
export function getStoredTokens(): TokenStore {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading tokens file:', error);
  }
  return { tokens: [] };
}

/**
 * Save tokens to file
 */
export function saveTokens(store: TokenStore): void {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error('Error saving tokens file:', error);
    throw error;
  }
}

/**
 * Add or update a push token
 */
export function upsertToken(tokenData: PushTokenData): void {
  const store = getStoredTokens();

  // Check if token already exists
  const existingIndex = store.tokens.findIndex(
    (t) => t.token === tokenData.token
  );

  if (existingIndex !== -1) {
    // Update existing token
    store.tokens[existingIndex] = {
      ...tokenData,
      timestamp: Date.now(),
    };
    console.log('Updated existing token:', tokenData.token);
  } else {
    // Add new token
    store.tokens.push({
      ...tokenData,
      timestamp: Date.now(),
    });
    console.log('Added new token:', tokenData.token);
  }

  saveTokens(store);
}

/**
 * Get all valid Expo push tokens
 */
export function getAllTokens(): string[] {
  const store = getStoredTokens();
  return store.tokens.map(t => t.token);
}
