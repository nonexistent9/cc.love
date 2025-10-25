import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Log the payload with timestamp
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] POST /api/message - Payload:`, JSON.stringify(payload, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Message received successfully',
      receivedAt: timestamp,
      data: payload
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
      { status: 400 }
    );
  }
}

