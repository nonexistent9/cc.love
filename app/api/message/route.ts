import { NextRequest, NextResponse } from "next/server";
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { sendPushNotificationTool } from "@/lib/ai-tools";
import { buildEnhancedSystemPrompt } from "@/lib/prompts";
import {
  loadConversationMemory,
  saveAnalysisToMemory,
  recordNotification,
  checkDuplicateRules,
  computeScreenshotHash,
  isScreenshotDuplicate,
} from "@/lib/conversation-memory";
import { getConversationId, getDeviceId } from "@/lib/conversation-id";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const frameFile = formData.get("frame") as File;
    const timestamp = formData.get("timestamp") as string;
    const frameNumber = formData.get("frameNumber") as string;
    const format = formData.get("format") as string;

    // NEW: Extract optional conversation tracking fields
    const providedConversationId = formData.get("conversationId") as string | null;
    const providedDeviceId = formData.get("deviceId") as string | null;

    if (!frameFile) {
      return NextResponse.json({ error: "No frame uploaded" }, { status: 400 });
    }

    // Log the payload with timestamp
    const receivedAt = new Date().toISOString();
    console.log(
      `[${receivedAt}] POST /api/message - Payload:`,
      JSON.stringify(
        {
          frameNumber,
          timestamp,
          format,
          size: frameFile.size,
          filename: frameFile.name,
          type: frameFile.type,
          conversationId: providedConversationId,
          deviceId: providedDeviceId,
        },
        null,
        2,
      ),
    );

    // Convert file to buffer and then to base64
    const arrayBuffer = await frameFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Compute screenshot hash for duplicate detection
    const screenshotHash = computeScreenshotHash(buffer);

    // Get or generate device ID
    const deviceId = providedDeviceId || getDeviceId(request.headers);

    // Get or generate conversation ID
    const conversationId = getConversationId(
      providedConversationId || undefined,
      deviceId,
      parseInt(timestamp) || Date.now()
    );

    console.log(`[${receivedAt}] Conversation ID: ${conversationId}, Device ID: ${deviceId}`);

    // Load conversation memory
    const memory = await loadConversationMemory(conversationId, deviceId);

    // Check for duplicate screenshot
    if (isScreenshotDuplicate(memory, screenshotHash)) {
      console.log(`[${receivedAt}] Duplicate screenshot detected, skipping analysis`);
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Duplicate screenshot already analyzed",
        conversationId,
        frameNumber: parseInt(frameNumber || "0"),
        timestamp: parseInt(timestamp || "0"),
      });
    }

    // Build enhanced system prompt with memory context
    const systemPrompt = buildEnhancedSystemPrompt(memory);

    // Process with Gemini AI
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      tools: {
        sendPushNotification: sendPushNotificationTool,
      },
      stopWhen: stepCountIs(4),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Based on what you see in the given image, choose to take an appropriate action according to the system prompt.
The image is a live preview of what the user is doing on their phone and you need to assist the user in rizzing the subject he's courting.
You have access to the sendPushNotificationTool which will allow you to communicate with the user.
`,
            },
            {
              type: "image",
              image: `data:image/jpeg;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const { text } = result;

    console.log(`[${receivedAt}] AI Description:`, text);

    // Save analysis to memory
    await saveAnalysisToMemory(conversationId, deviceId, {
      timestamp: parseInt(timestamp) || Date.now(),
      frameNumber: parseInt(frameNumber || "0"),
      aiAnalysis: text,
      screenshotHash,
    });

    // Log and record any tool calls (e.g., push notifications sent)
    const toolCalls =
      result.steps?.flatMap(
        (step) =>
          step.toolCalls?.map((call) => ({
            tool: call.toolName,
            args: call.args,
          })) || [],
      ) || [];

    if (toolCalls.length > 0) {
      console.log(
        `[${receivedAt}] Tool calls executed:`,
        JSON.stringify(toolCalls, null, 2),
      );

      // Record notifications in memory
      for (const call of toolCalls) {
        if (call.tool === "sendPushNotification" && call.args) {
          const args = call.args as { title: string; body: string };

          // Determine notification type from the message content
          const notificationType = determineNotificationType(args.body);

          await recordNotification(conversationId, deviceId, {
            type: notificationType,
            title: args.title,
            body: args.body,
            sentAt: Date.now(),
            triggerReason: text, // Use AI analysis as trigger reason
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      conversationId,
      deviceId,
      frameNumber: parseInt(frameNumber || "0"),
      timestamp: parseInt(timestamp || "0"),
      receivedSize: frameFile.size,
      format,
      description: text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      receivedAt,
      memoryStats: {
        messagesInMemory: memory.messages.length + 1,
        notificationsSent: memory.notifications.length + toolCalls.filter(c => c.tool === "sendPushNotification").length,
        conversationState: memory.patterns.currentState,
      },
    });
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] POST /api/message - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Determines the notification type based on the message content
 * This helps categorize notifications for duplicate detection
 */
function determineNotificationType(messageBody: string): string {
  const lower = messageBody.toLowerCase();

  if (lower.includes("small talk") || lower.includes("beating around the bush")) {
    return "endless-small-talk";
  }
  if (lower.includes("you pick") || lower.includes("passive") || lower.includes("decisiveness")) {
    return "passive-planning";
  }
  if (lower.includes("friendzone") || lower.includes("tame")) {
    return "friendzone-alert";
  }
  if (lower.includes("dumb") || lower.includes("boring message") || lower.includes("do not hit send")) {
    return "dumb-message";
  }

  return "general-advice";
}
