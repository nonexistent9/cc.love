export interface ConversationMessage {
  timestamp: number;
  frameNumber: number;
  aiAnalysis: string;
  screenshotHash?: string;
}

export interface NotificationRecord {
  type: string; // e.g., 'endless-small-talk', 'passive-planning', 'friendzone-alert', 'dumb-message'
  title: string;
  body: string;
  sentAt: number;
  triggerReason: string;
}

export interface UserPatterns {
  commonMistakes: string[];
  improvements: string[];
  currentState: string; // e.g., "improving", "regressing", "stagnant", "new"
}

export interface ConversationMemory {
  conversationId: string;
  deviceId: string;
  startedAt: number;
  lastUpdatedAt: number;

  // Conversation context
  messages: ConversationMessage[];

  // Notification history
  notifications: NotificationRecord[];

  // User patterns
  patterns: UserPatterns;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
  lastSentAt?: number;
}
