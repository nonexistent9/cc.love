import { NextRequest, NextResponse } from "next/server";
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { sendPushNotificationTool } from "@/lib/ai-tools";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const frameFile = formData.get("frame") as File;
    const timestamp = formData.get("timestamp") as string;
    const frameNumber = formData.get("frameNumber") as string;
    const format = formData.get("format") as string;

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
        },
        null,
        2,
      ),
    );

    // Convert file to buffer and then to base64
    const arrayBuffer = await frameFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Process with Gemini AI
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      tools: {
        sendPushNotification: sendPushNotificationTool,
      },
      stopWhen: stepCountIs(4),
      system: SYSTEM_PROMPT,
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

    // Log any tool calls (e.g., push notifications sent)
    const toolCalls =
      result.steps?.flatMap(
        (step) =>
          step.toolCalls?.map((call) => ({
            tool: call.toolName,
          })) || [],
      ) || [];

    if (toolCalls.length > 0) {
      console.log(
        `[${receivedAt}] Tool calls executed:`,
        JSON.stringify(toolCalls, null, 2),
      );
    }

    return NextResponse.json({
      success: true,
      frameNumber: parseInt(frameNumber || "0"),
      timestamp: parseInt(timestamp || "0"),
      receivedSize: frameFile.size,
      format,
      description: text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      receivedAt,
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
