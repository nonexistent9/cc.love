import { NextRequest, NextResponse } from 'next/server';
import { getStoredTokens, upsertToken, type PushTokenData } from '@/lib/push-tokens';

/**
 * POST /api/push-tokens
 * Receives and stores push tokens from mobile devices
 */
export async function POST(request: NextRequest) {
  try {
    const tokenData: PushTokenData = await request.json();
    const timestamp = new Date().toISOString();

    // Validate required fields
    if (!tokenData.token) {
      console.error(`[${timestamp}] POST /api/push-tokens - Missing token`);
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Log the received token data
    console.log(`[${timestamp}] POST /api/push-tokens - Received:`, JSON.stringify({
      token: tokenData.token.substring(0, 20) + '...',
      deviceId: tokenData.deviceId,
      deviceName: tokenData.deviceName,
      platform: tokenData.platform,
    }, null, 2));

    // Save the token
    upsertToken(tokenData);

    // Get updated token count
    const store = getStoredTokens();

    console.log(`[${timestamp}] Token saved successfully. Total tokens: ${store.tokens.length}`);

    return NextResponse.json({
      success: true,
      message: 'Token saved successfully',
      tokenCount: store.tokens.length,
    });
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] POST /api/push-tokens - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save token',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push-tokens
 * Returns all stored tokens (useful for debugging)
 */
export async function GET() {
  try {
    const store = getStoredTokens();
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] GET /api/push-tokens - Retrieved ${store.tokens.length} tokens`);

    return NextResponse.json({
      success: true,
      count: store.tokens.length,
      tokens: store.tokens,
    });
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] GET /api/push-tokens - Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
