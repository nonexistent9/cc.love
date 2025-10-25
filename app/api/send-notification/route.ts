import { NextRequest, NextResponse } from 'next/server';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { getAllTokens } from '@/lib/push-tokens';

// Create a new Expo SDK client
const expo = new Expo();

interface SendNotificationRequest {
  to: string | string[] | 'all';
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * POST /api/send-notification
 * Sends push notifications to one or more devices
 *
 * Request Body:
 * {
 *   "to": "ExponentPushToken[xxx]" | ["ExponentPushToken[xxx]", ...] | "all",
 *   "title": "Notification Title",
 *   "body": "Notification message",
 *   "data": { "key": "value" } (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationRequest = await request.json();
    const timestamp = new Date().toISOString();

    // Validate required fields
    if (!body.title || !body.body) {
      console.error(`[${timestamp}] POST /api/send-notification - Missing required fields`);
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['title', 'body'],
        },
        { status: 400 }
      );
    }

    // Log the request
    console.log(`[${timestamp}] POST /api/send-notification - Request:`, JSON.stringify({
      to: body.to,
      title: body.title,
      body: body.body,
      hasData: !!body.data,
    }, null, 2));

    // Determine target tokens
    let targetTokens: string[] = [];

    if (body.to === 'all') {
      // Send to all stored tokens
      targetTokens = await getAllTokens();

      if (targetTokens.length === 0) {
        console.warn(`[${timestamp}] No tokens found in storage`);
        return NextResponse.json(
          {
            error: 'No tokens found in storage',
            message: 'Register at least one device first',
          },
          { status: 400 }
        );
      }

      console.log(`[${timestamp}] Sending to all ${targetTokens.length} registered devices`);
    } else if (Array.isArray(body.to)) {
      // Send to multiple specific tokens
      targetTokens = body.to;
      console.log(`[${timestamp}] Sending to ${targetTokens.length} specific tokens`);
    } else if (typeof body.to === 'string') {
      // Send to a single token
      targetTokens = [body.to];
      console.log(`[${timestamp}] Sending to 1 specific token`);
    } else {
      console.error(`[${timestamp}] Invalid "to" parameter`);
      return NextResponse.json(
        {
          error: 'Invalid "to" parameter',
          message: 'Must be a token string, array of tokens, or "all"',
        },
        { status: 400 }
      );
    }

    // Validate all tokens are valid Expo push tokens
    const validTokens = targetTokens.filter((token) =>
      Expo.isExpoPushToken(token)
    );

    const invalidTokens = targetTokens.filter(
      (token) => !Expo.isExpoPushToken(token)
    );

    if (invalidTokens.length > 0) {
      console.warn(`[${timestamp}] Found ${invalidTokens.length} invalid tokens:`, invalidTokens);
    }

    if (validTokens.length === 0) {
      console.error(`[${timestamp}] No valid Expo push tokens found`);
      return NextResponse.json(
        {
          error: 'No valid Expo push tokens found',
          invalidTokens: targetTokens,
        },
        { status: 400 }
      );
    }

    console.log(`[${timestamp}] Validated ${validTokens.length} valid tokens`);

    // Create push notification messages
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title: body.title,
      body: body.body,
      data: body.data || {},
    }));

    // Send notifications in chunks (Expo recommends chunking)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];
    let chunkIndex = 0;

    for (const chunk of chunks) {
      try {
        console.log(`[${timestamp}] Sending chunk ${++chunkIndex}/${chunks.length} with ${chunk.length} notifications`);
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log(`[${timestamp}] Chunk ${chunkIndex} sent successfully`);
      } catch (error) {
        console.error(`[${timestamp}] Error sending chunk ${chunkIndex}:`, error);
      }
    }

    // Analyze results
    const successCount = tickets.filter((ticket) => ticket.status === 'ok').length;
    const errorTickets = tickets.filter((ticket) => ticket.status === 'error');

    if (errorTickets.length > 0) {
      console.error(`[${timestamp}] ${errorTickets.length} notifications failed:`, errorTickets);
    }

    console.log(`[${timestamp}] Successfully sent ${successCount}/${tickets.length} notifications`);

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: tickets.length,
      errors: errorTickets.length > 0 ? errorTickets : undefined,
      invalidTokens: invalidTokens.length > 0 ? invalidTokens : undefined,
      tickets,
    });
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] POST /api/send-notification - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
