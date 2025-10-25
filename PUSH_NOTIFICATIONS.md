# Push Notifications - Backend Implementation

This Next.js backend now supports push notifications for the iOS app.

## What Was Added

### 1. Dependencies (`package.json`)
- `expo-server-sdk` - Expo's SDK for sending push notifications

### 2. Token Storage System (`lib/push-tokens.ts`)
Utility functions for managing device push tokens:
- `getStoredTokens()` - Retrieve all stored tokens
- `saveTokens()` - Save tokens to file
- `upsertToken()` - Add or update a token
- `getAllTokens()` - Get all token strings

**Storage:** Currently uses `push-tokens.json` file (excluded from git). For production, migrate to a database.

### 3. API Endpoints

#### `POST /api/push-tokens`
Receives and stores push tokens from the iOS app.

**Request:**
```json
{
  "token": "ExponentPushToken[xxxxxx]",
  "deviceId": "device-id",
  "deviceName": "Ferran's iPhone",
  "platform": "ios"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token saved successfully",
  "tokenCount": 1
}
```

#### `GET /api/push-tokens`
Returns all stored tokens (useful for debugging).

**Response:**
```json
{
  "success": true,
  "count": 1,
  "tokens": [...]
}
```

#### `POST /api/send-notification`
Sends push notifications to devices.

**Request:**
```json
{
  "to": "all",
  "title": "Hello!",
  "body": "Your notification message",
  "data": {
    "custom": "data"
  }
}
```

**`to` options:**
- `"all"` - Send to all registered devices
- `"ExponentPushToken[xxx]"` - Send to specific token
- `["token1", "token2"]` - Send to multiple tokens

**Response:**
```json
{
  "success": true,
  "sent": 1,
  "total": 1,
  "tickets": [...]
}
```

## Testing

### 1. Start Development Server
```bash
bun run dev
```

### 2. Test Token Storage
```bash
curl -X POST http://localhost:3000/api/push-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[test]",
    "deviceId": "test-device",
    "deviceName": "Test Device",
    "platform": "ios"
  }'
```

### 3. View Stored Tokens
```bash
curl http://localhost:3000/api/push-tokens
```

### 4. Send Test Notification
```bash
curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "to": "all",
    "title": "Test",
    "body": "Hello from the backend!"
  }'
```

## Production Deployment

### Deploy to Vercel
```bash
vercel --prod
```

Your endpoints will be available at:
- `https://cc-love.vercel.app/api/push-tokens`
- `https://cc-love.vercel.app/api/send-notification`

### Environment Variables (Optional)
No environment variables are required for basic operation. The Expo Push service works out of the box.

## Integration with iOS App

The iOS app (`/Users/ferran/workspace/cc`) is already configured to:
1. Request notification permissions on launch
2. Get an Expo Push Token
3. Send the token to `https://cc-love.vercel.app/api/push-tokens`

## Sending Notifications from Your Code

### Example: Notify on Frame Upload
You could modify `/app/api/message/route.ts` to send a notification when a frame is processed:

```typescript
import { sendNotification } from '@/lib/send-notification';

// After processing frame...
await sendNotification({
  to: 'all',
  title: 'Frame Processed',
  body: `Frame #${frameNumber} analyzed successfully`,
  data: { frameNumber, description: text }
});
```

### Example Helper Function
Create `/lib/send-notification.ts`:

```typescript
export async function sendNotification(params: {
  to: string | string[] | 'all';
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/send-notification`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }
  );
  return response.json();
}
```

## File Structure

```
cc.love/
├── app/
│   └── api/
│       ├── push-tokens/
│       │   └── route.ts        # Store device tokens
│       └── send-notification/
│           └── route.ts        # Send notifications
├── lib/
│   └── push-tokens.ts          # Token management utilities
├── push-tokens.json            # Token storage (gitignored)
└── package.json                # Added expo-server-sdk
```

## Migration to Database

For production, replace file-based storage with a database:

### Example with Prisma + PostgreSQL

1. Install Prisma:
```bash
bun add prisma @prisma/client
```

2. Create schema:
```prisma
model PushToken {
  id         String   @id @default(cuid())
  token      String   @unique
  deviceId   String?
  deviceName String?
  platform   String
  timestamp  DateTime @default(now())
}
```

3. Update `lib/push-tokens.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function upsertToken(tokenData: PushTokenData) {
  await prisma.pushToken.upsert({
    where: { token: tokenData.token },
    update: tokenData,
    create: tokenData,
  });
}
```

## Troubleshooting

### No tokens in storage
- Run the iOS app on a physical device
- Check that permissions were granted
- Check iOS app logs for "Token sent to backend successfully"
- Verify backend received the token: `curl http://localhost:3000/api/push-tokens`

### Notifications not received
- Ensure using a physical device (not simulator)
- Verify token is valid Expo push token (starts with `ExponentPushToken[`)
- Check Expo project ID in iOS app (`app/utils/notifications.ts`)
- View logs in `/api/send-notification` endpoint

### Invalid Expo push token
- The token must be a real Expo push token from the mobile app
- Test tokens won't work, you need a real device token

## Resources

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## Next Steps

1. Deploy to Vercel: `vercel --prod`
2. Run iOS app on physical device
3. Test sending notifications via API
4. Integrate notification sending into your business logic
5. Migrate to database for production
