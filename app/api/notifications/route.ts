import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/kv';
import type { ConversationMemory, NotificationRecord } from '@/types/memory';

/**
 * GET /api/notifications?deviceId=xxx
 * Fetches all notifications for a given device across all conversations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId parameter is required' },
        { status: 400 }
      );
    }

    // Get all conversation IDs for this device
    const userConversationsKey = `user:${deviceId}:conversations`;
    const conversationIds = await redis.smembers<string[]>(userConversationsKey);

    if (!conversationIds || conversationIds.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // Fetch all conversation memories
    const allNotifications: Array<NotificationRecord & { conversationId: string }> = [];

    for (const conversationId of conversationIds) {
      const conversationKey = `conversations:${conversationId}`;
      const memory = await redis.get<ConversationMemory>(conversationKey);

      if (memory && memory.notifications) {
        // Add conversationId to each notification for context
        const notificationsWithContext = memory.notifications.map(notification => ({
          ...notification,
          conversationId,
        }));
        allNotifications.push(...notificationsWithContext);
      }
    }

    // Sort by sentAt timestamp (most recent first)
    allNotifications.sort((a, b) => b.sentAt - a.sentAt);

    return NextResponse.json({
      notifications: allNotifications,
      count: allNotifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
