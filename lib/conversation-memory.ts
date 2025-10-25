import { redis } from "./kv";
import type {
  ConversationMemory,
  ConversationMessage,
  NotificationRecord,
  UserPatterns,
  DuplicateCheckResult,
} from "@/types/memory";

/**
 * Hard rule: Don't send the same notification type within this time window
 */
const NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Maximum number of messages to keep in memory (keeps memory bounded)
 */
const MAX_MESSAGES_IN_MEMORY = 20;

/**
 * Maximum number of notifications to keep in memory
 */
const MAX_NOTIFICATIONS_IN_MEMORY = 10;

/**
 * Generates Redis key for conversation memory
 */
function getConversationKey(conversationId: string): string {
  return `conversations:${conversationId}`;
}

/**
 * Generates Redis key for user's conversation list
 */
function getUserConversationsKey(deviceId: string): string {
  return `user:${deviceId}:conversations`;
}

/**
 * Loads conversation memory from Redis
 * Creates new memory object if conversation doesn't exist
 */
export async function loadConversationMemory(
  conversationId: string,
  deviceId: string
): Promise<ConversationMemory> {
  try {
    const key = getConversationKey(conversationId);
    const data = await redis.get<ConversationMemory>(key);

    if (data) {
      return data;
    }

    // Create new conversation memory
    const newMemory: ConversationMemory = {
      conversationId,
      deviceId,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      messages: [],
      notifications: [],
      patterns: {
        commonMistakes: [],
        improvements: [],
        currentState: "new",
      },
    };

    return newMemory;
  } catch (error) {
    console.error("Error loading conversation memory:", error);
    // Return fresh memory on error
    return {
      conversationId,
      deviceId,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      messages: [],
      notifications: [],
      patterns: {
        commonMistakes: [],
        improvements: [],
        currentState: "new",
      },
    };
  }
}

/**
 * Saves conversation memory to Redis
 */
async function saveConversationMemory(
  memory: ConversationMemory
): Promise<void> {
  try {
    const key = getConversationKey(memory.conversationId);

    // Update timestamp
    memory.lastUpdatedAt = Date.now();

    // Trim messages and notifications to keep memory bounded
    if (memory.messages.length > MAX_MESSAGES_IN_MEMORY) {
      memory.messages = memory.messages.slice(-MAX_MESSAGES_IN_MEMORY);
    }
    if (memory.notifications.length > MAX_NOTIFICATIONS_IN_MEMORY) {
      memory.notifications = memory.notifications.slice(
        -MAX_NOTIFICATIONS_IN_MEMORY
      );
    }

    // Save to Redis with 7 day expiration
    await redis.set(key, memory, { ex: 7 * 24 * 60 * 60 });

    // Add conversation ID to user's conversation list
    const userKey = getUserConversationsKey(memory.deviceId);
    await redis.sadd(userKey, memory.conversationId);
    // Set expiration on user's conversation list too
    await redis.expire(userKey, 7 * 24 * 60 * 60);
  } catch (error) {
    console.error("Error saving conversation memory:", error);
    throw error;
  }
}

/**
 * Appends a new analysis message to conversation memory
 */
export async function saveAnalysisToMemory(
  conversationId: string,
  deviceId: string,
  message: ConversationMessage
): Promise<void> {
  const memory = await loadConversationMemory(conversationId, deviceId);

  memory.messages.push(message);

  await saveConversationMemory(memory);
}

/**
 * Records a notification in conversation memory
 */
export async function recordNotification(
  conversationId: string,
  deviceId: string,
  notification: NotificationRecord
): Promise<void> {
  const memory = await loadConversationMemory(conversationId, deviceId);

  memory.notifications.push(notification);

  await saveConversationMemory(memory);
}

/**
 * Updates user patterns in conversation memory
 */
export async function updatePatterns(
  conversationId: string,
  deviceId: string,
  patterns: Partial<UserPatterns>
): Promise<void> {
  const memory = await loadConversationMemory(conversationId, deviceId);

  memory.patterns = {
    ...memory.patterns,
    ...patterns,
  };

  await saveConversationMemory(memory);
}

/**
 * Checks hard rules for duplicate notifications
 * These are fast, pre-LLM checks to prevent obvious spam
 */
export function checkDuplicateRules(
  memory: ConversationMemory,
  notificationType: string
): DuplicateCheckResult {
  const now = Date.now();

  // Check if same notification type was sent recently (within cooldown)
  const recentSameType = memory.notifications.find(
    (n) => n.type === notificationType && now - n.sentAt < NOTIFICATION_COOLDOWN_MS
  );

  if (recentSameType) {
    const minutesAgo = Math.floor((now - recentSameType.sentAt) / 1000 / 60);
    return {
      isDuplicate: true,
      reason: `Same notification type "${notificationType}" sent ${minutesAgo} minutes ago`,
      lastSentAt: recentSameType.sentAt,
    };
  }

  // Not a duplicate according to hard rules
  return {
    isDuplicate: false,
  };
}

/**
 * Computes a hash of an image buffer for duplicate detection
 */
export function computeScreenshotHash(imageBuffer: Buffer): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(imageBuffer).digest("hex");
}

/**
 * Checks if a screenshot hash was already analyzed
 */
export function isScreenshotDuplicate(
  memory: ConversationMemory,
  screenshotHash: string
): boolean {
  return memory.messages.some((m) => m.screenshotHash === screenshotHash);
}

/**
 * Gets a summary of conversation memory for display/debugging
 */
export function getMemorySummary(memory: ConversationMemory): string {
  const messageCount = memory.messages.length;
  const notificationCount = memory.notifications.length;
  const lastNotification = memory.notifications[memory.notifications.length - 1];

  return `Conversation ${memory.conversationId}: ${messageCount} messages, ${notificationCount} notifications. Current state: ${memory.patterns.currentState}. Last notification: ${lastNotification ? lastNotification.type : "none"}`;
}
