/**
 * Shared utilities for notification handling
 */

/**
 * Determines the notification type based on the message content
 * This helps categorize notifications for duplicate detection
 */
export function determineNotificationType(messageBody: string): string {
  const lower = messageBody.toLowerCase();

  if (
    lower.includes("small talk") ||
    lower.includes("beating around the bush")
  ) {
    return "endless-small-talk";
  }
  if (
    lower.includes("you pick") ||
    lower.includes("passive") ||
    lower.includes("decisiveness")
  ) {
    return "passive-planning";
  }
  if (lower.includes("friendzone") || lower.includes("tame")) {
    return "friendzone-alert";
  }
  if (
    lower.includes("dumb") ||
    lower.includes("boring message") ||
    lower.includes("do not hit send")
  ) {
    return "dumb-message";
  }

  return "general-advice";
}
