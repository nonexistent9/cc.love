import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/kv';
import type { ConversationMemory, NotificationRecord } from '@/types/memory';

/**
 * GET /api/notifications?deviceId=xxx&all=true
 * Fetches all notifications for a given device across all conversations
 * Use all=true to fetch ALL notifications across ALL devices (for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const fetchAll = searchParams.get('all') === 'true';

    // Fetch all conversation memories
    const allNotifications: Array<NotificationRecord & { conversationId: string; deviceId: string }> = [];

    if (fetchAll) {
      // Fetch ALL conversations from ALL devices
      console.log('[Notifications API] Fetching ALL notifications across all devices');

      // Scan for all conversation keys
      const allKeys = await redis.keys('conversations:*');
      console.log(`[Notifications API] Found ${allKeys.length} conversation keys`);

      for (const key of allKeys) {
        const memory = await redis.get<ConversationMemory>(key);

        if (memory && memory.notifications && memory.notifications.length > 0) {
          console.log(`[Notifications API] Key: ${key}, DeviceId: ${memory.deviceId}, Notifications: ${memory.notifications.length}`);
          const notificationsWithContext = memory.notifications.map(notification => ({
            ...notification,
            conversationId: memory.conversationId,
            deviceId: memory.deviceId,
          }));
          allNotifications.push(...notificationsWithContext);
        }
      }
    } else {
      // Fetch for specific device
      if (!deviceId) {
        return NextResponse.json(
          { error: 'deviceId parameter is required (or use all=true)' },
          { status: 400 }
        );
      }

      console.log(`[Notifications API] Fetching notifications for deviceId: ${deviceId}`);

      // Get all conversation IDs for this device
      const userConversationsKey = `user:${deviceId}:conversations`;
      const conversationIds = await redis.smembers<string[]>(userConversationsKey);

      console.log(`[Notifications API] Found ${conversationIds?.length || 0} conversations for device`);

      if (!conversationIds || conversationIds.length === 0) {
        return NextResponse.json({ notifications: [], count: 0 });
      }

      for (const conversationId of conversationIds) {
        const conversationKey = `conversations:${conversationId}`;
        const memory = await redis.get<ConversationMemory>(conversationKey);

        if (memory && memory.notifications) {
          const notificationsWithContext = memory.notifications.map(notification => ({
            ...notification,
            conversationId,
            deviceId: memory.deviceId,
          }));
          allNotifications.push(...notificationsWithContext);
        }
      }
    }

    // Sort by sentAt timestamp (most recent first)
    allNotifications.sort((a, b) => b.sentAt - a.sentAt);

    // Limit to last 10 notifications
    const limitedNotifications = allNotifications.slice(0, 10);

    console.log(`[Notifications API] Found ${allNotifications.length} total notifications, returning last 10`);

    return NextResponse.json({
      notifications: limitedNotifications,
      count: limitedNotifications.length,
      total: allNotifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
