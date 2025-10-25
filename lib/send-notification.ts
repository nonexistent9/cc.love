import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { getAllTokens } from "./push-tokens";

const expo = new Expo();

export interface SendNotificationOptions {
  to: string | string[] | "all";
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface SendNotificationResult {
  success: boolean;
  sent: number;
  total: number;
  errors?: Array<{ token?: string; message: string }>;
  invalidTokens?: string[];
  tickets: ExpoPushTicket[];
}

/**
 * Sends push notifications to one or more devices
 *
 * @param options - Notification options
 * @param options.to - Target: specific token(s) or 'all' for all registered devices
 * @param options.title - Notification title
 * @param options.body - Notification message
 * @param options.data - Optional custom data
 * @returns Promise with send results
 *
 * @example
 * // Send to all users
 * await sendNotification({
 *   to: 'all',
 *   title: 'Welcome!',
 *   body: 'Thanks for joining!'
 * });
 *
 * @example
 * // Send to specific token
 * await sendNotification({
 *   to: 'ExponentPushToken[xxx]',
 *   title: 'Hello',
 *   body: 'Message'
 * });
 */
export async function sendNotification(
  options: SendNotificationOptions,
): Promise<SendNotificationResult> {
  const timestamp = new Date().toISOString();

  // Validate required fields
  if (!options.title || !options.body) {
    throw new Error("Missing required fields: title and body are required");
  }

  // Log the request
  console.log(
    `[${timestamp}] sendNotification - Request:`,
    JSON.stringify(
      {
        to: options.to,
        title: options.title,
        body: options.body,
        hasData: !!options.data,
      },
      null,
      2,
    ),
  );

  // Determine target tokens
  let targetTokens: string[] = [];

  if (options.to === "all") {
    // Send to all stored tokens
    targetTokens = await getAllTokens();

    if (targetTokens.length === 0) {
      throw new Error(
        "No tokens found in storage. Register at least one device first.",
      );
    }

    console.log(
      `[${timestamp}] Sending to all ${targetTokens.length} registered devices`,
    );
  } else if (Array.isArray(options.to)) {
    // Send to multiple specific tokens
    targetTokens = options.to;
    console.log(
      `[${timestamp}] Sending to ${targetTokens.length} specific tokens`,
    );
  } else if (typeof options.to === "string") {
    // Send to a single token
    targetTokens = [options.to];
    console.log(`[${timestamp}] Sending to 1 specific token`);
  } else {
    throw new Error(
      'Invalid "to" parameter. Must be a token string, array of tokens, or "all"',
    );
  }

  // Validate all tokens are valid Expo push tokens
  const validTokens = targetTokens.filter((token) =>
    Expo.isExpoPushToken(token),
  );

  const invalidTokens = targetTokens.filter(
    (token) => !Expo.isExpoPushToken(token),
  );

  if (invalidTokens.length > 0) {
    console.warn(
      `[${timestamp}] Found ${invalidTokens.length} invalid tokens:`,
      invalidTokens,
    );
  }

  if (validTokens.length === 0) {
    throw new Error(
      `No valid Expo push tokens found. Invalid tokens: ${targetTokens.join(", ")}`,
    );
  }

  console.log(`[${timestamp}] Validated ${validTokens.length} valid tokens`);

  // Create push notification messages
  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: "default",
    priority: "high",
    badge: 1,
    title: options.title,
    body: options.body,
    data: options.data || {},
  }));

  // Send notifications in chunks (Expo recommends chunking)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];
  let chunkIndex = 0;

  for (const chunk of chunks) {
    try {
      console.log(
        `[${timestamp}] Sending chunk ${++chunkIndex}/${chunks.length} with ${chunk.length} notifications`,
      );
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log(`[${timestamp}] Chunk ${chunkIndex} sent successfully`);
    } catch (error) {
      console.error(`[${timestamp}] Error sending chunk ${chunkIndex}:`, error);
    }
  }

  // Analyze results
  const successCount = tickets.filter(
    (ticket) => ticket.status === "ok",
  ).length;
  const errorTickets = tickets.filter((ticket) => ticket.status === "error");

  if (errorTickets.length > 0) {
    console.error(
      `[${timestamp}] ${errorTickets.length} notifications failed:`,
      errorTickets,
    );
  }

  console.log(
    `[${timestamp}] Successfully sent ${successCount}/${tickets.length} notifications`,
  );

  return {
    success: successCount > 0,
    sent: successCount,
    total: tickets.length,
    errors:
      errorTickets.length > 0
        ? errorTickets.map((t) => ({
            token: t.status === "error" ? undefined : undefined,
            message: t.status === "error" ? t.message : "",
          }))
        : undefined,
    invalidTokens: invalidTokens.length > 0 ? invalidTokens : undefined,
    tickets,
  };
}

/**
 * Sends a push notification to all registered users
 *
 * @param title - Notification title
 * @param body - Notification message
 * @param data - Optional custom data
 * @returns Promise with send results
 *
 * @example
 * await sendNotificationToAll(
 *   'New Feature!',
 *   'Check out our latest update'
 * );
 */
export async function sendNotificationToAll(
  title: string,
  body: string,
): Promise<SendNotificationResult> {
  return sendNotification({ to: "all", title, body });
}
