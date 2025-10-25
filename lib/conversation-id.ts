import crypto from "crypto";

/**
 * Time window for conversation clustering (2 hours)
 * Screenshots from the same device within this window are considered the same conversation
 */
const CONVERSATION_TIME_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Generates a conversation ID based on device and timestamp clustering
 * @param deviceId - Unique device identifier
 * @param timestamp - Current timestamp in milliseconds
 * @returns A deterministic conversation ID
 */
export function generateConversationId(
  deviceId: string,
  timestamp: number
): string {
  // Round timestamp to conversation window buckets
  // This ensures screenshots from the same device within the time window get the same ID
  const windowStart = Math.floor(timestamp / CONVERSATION_TIME_WINDOW_MS);

  // Create deterministic hash of deviceId + time window
  const hash = crypto
    .createHash("sha256")
    .update(`${deviceId}:${windowStart}`)
    .digest("hex")
    .substring(0, 16);

  return `conv_${hash}`;
}

/**
 * Gets or generates a conversation ID
 * @param providedId - Optional conversation ID provided by client
 * @param deviceId - Device identifier for generating ID if not provided
 * @param timestamp - Timestamp for generating ID if not provided
 * @returns A valid conversation ID
 */
export function getConversationId(
  providedId: string | undefined,
  deviceId: string,
  timestamp: number
): string {
  // If client provided a conversation ID, use it
  if (providedId && providedId.trim()) {
    return providedId.trim();
  }

  // Otherwise, generate one based on device + time clustering
  return generateConversationId(deviceId, timestamp);
}

/**
 * Extracts device ID from request headers or generates a default
 * @param headers - Request headers
 * @param fallbackId - Fallback ID if none found (e.g., 'unknown-device')
 * @returns Device identifier
 */
export function getDeviceId(
  headers: Headers,
  fallbackId: string = "unknown-device"
): string {
  // Try to get device ID from various headers
  const deviceId =
    headers.get("x-device-id") ||
    headers.get("x-client-id") ||
    headers.get("user-agent") ||
    fallbackId;

  return deviceId;
}
