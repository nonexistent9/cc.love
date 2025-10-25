import { tool } from "ai";
import { z } from "zod";
import { sendNotificationToAll } from "./send-notification";

/**
 * AI SDK tool for sending push notifications to all users
 *
 * This tool can be used by LLMs to send push notifications when appropriate.
 * For example, when processing important events, alerts, or user-requested notifications.
 *
 * @example
 * import { generateText } from 'ai';
 * import { google } from '@ai-sdk/google';
 * import { sendPushNotificationTool } from '@/lib/ai-tools';
 *
 * const result = await generateText({
 *   model: google('gemini-2.5-flash'),
 *   tools: {
 *     sendPushNotification: sendPushNotificationTool,
 *   },
 *   maxSteps: 5,
 *   prompt: 'Send a notification to all users about the new feature launch',
 * });
 */
export const sendPushNotificationTool = tool({
  description:
    "Sends a push notification to all registered users. Use this when you need to alert or notify all users about important information, updates, or events.",
  inputSchema: z.object({
    title: z
      .string()
      .describe("The notification title (short and attention-grabbing)"),
    body: z
      .string()
      .describe("The notification message body (clear and concise)"),
  }),
  execute: async ({ title, body }) => {
    try {
      const result = await sendNotificationToAll(title, body);

      if (!result.success) {
        return {
          success: false,
          error: "Failed to send notifications",
          details: result.errors,
        };
      }

      return {
        success: true,
        message: `Successfully sent push notification to ${result.sent} users`,
        sent: result.sent,
        total: result.total,
        invalidTokens: result.invalidTokens?.length || 0,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Collection of all AI tools for easy import
 */
export const aiTools = {
  sendPushNotification: sendPushNotificationTool,
};
