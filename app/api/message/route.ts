import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const frameFile = formData.get('frame') as File;
    const timestamp = formData.get('timestamp') as string;
    const frameNumber = formData.get('frameNumber') as string;
    const format = formData.get('format') as string;

    if (!frameFile) {
      return NextResponse.json(
        { error: 'No frame uploaded' },
        { status: 400 }
      );
    }

    // Log the payload with timestamp
    const receivedAt = new Date().toISOString();
    console.log(`[${receivedAt}] POST /api/message - Payload:`, JSON.stringify({
      frameNumber,
      timestamp,
      format,
      size: frameFile.size,
      filename: frameFile.name,
      type: frameFile.type,
    }, null, 2));

    // Convert file to buffer and then to base64
    const arrayBuffer = await frameFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Process with Gemini AI
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe what you see in this screen recording frame. Be concise and focus on the main elements.' },
            {
              type: 'image',
              image: `data:image/jpeg;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    console.log(`[${receivedAt}] AI Description:`, text);

    return NextResponse.json({
      success: true,
      frameNumber: parseInt(frameNumber || '0'),
      timestamp: parseInt(timestamp || '0'),
      receivedSize: frameFile.size,
      format,
      description: text,
      receivedAt,
    });
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] POST /api/message - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

