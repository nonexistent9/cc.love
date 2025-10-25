# Testing Push Notifications

## Prerequisites

1. **Start the development server:**
   ```bash
   bun dev
   ```

2. **Make sure you have at least one registered device token:**
   - Install the Expo Go app on your phone
   - Register your device token via the `/api/push-tokens` endpoint
   - Or check existing tokens: `curl http://localhost:3000/api/push-tokens`

## Test Methods

### Method 1: Direct Notification API (Simple)

Send a notification directly to all users:

```bash
curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{"to":"all","title":"Test","body":"Testing notifications"}'
```

**Expected Response:**
```json
{
  "success": true,
  "sent": 1,
  "total": 1,
  "tickets": [...]
}
```

### Method 2: AI-Powered Notifications via /api/message (Full Test)

#### Option A: Using the test script

```bash
./test-notification.sh /path/to/image.jpg
```

Or let it create a test image automatically (requires ImageMagick):
```bash
./test-notification.sh
```

#### Option B: Manual curl command

```bash
curl -X POST http://localhost:3000/api/message \
  -F "frame=@/path/to/screenshot.jpg" \
  -F "timestamp=$(date +%s)000" \
  -F "frameNumber=1" \
  -F "format=jpeg"
```

**Expected Response:**
```json
{
  "success": true,
  "frameNumber": 1,
  "timestamp": 1234567890,
  "receivedSize": 12345,
  "format": "jpeg",
  "description": "I see a critical error message...",
  "toolCalls": [
    {
      "tool": "sendPushNotification",
      "args": {
        "title": "Critical Error Detected",
        "body": "System failure detected in your screen recording"
      },
      "result": {
        "success": true,
        "sent": 1
      }
    }
  ]
}
```

### Method 3: Using the library function directly

Create a test file:

```typescript
// test.ts
import { sendNotificationToAll } from './lib/send-notification';

async function test() {
  const result = await sendNotificationToAll(
    'Test Notification',
    'This is a test from the library'
  );
  console.log(result);
}

test();
```

Run it:
```bash
bun test.ts
```

## How the AI Decides to Send Notifications

The AI in `/api/message` will automatically send notifications when it detects:
- Error messages or critical alerts
- Important system events
- Completed tasks or achievements
- Security warnings
- Any other content it deems important enough to notify users

To **increase likelihood** of AI sending a notification, use images with:
- Red error messages
- "CRITICAL", "ERROR", "ALERT" text
- Warning symbols
- Obvious failures or issues

## Debugging

1. **Check server logs** - All notifications are logged with timestamps
2. **Verify tokens exist**: `curl http://localhost:3000/api/push-tokens`
3. **Check environment variables** - Make sure Redis is configured
4. **Test with production URL** - Replace `localhost:3000` with `https://cc-love.vercel.app`

## Production Testing

For production:
```bash
curl -X POST https://cc-love.vercel.app/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{"to":"all","title":"Production Test","body":"Testing from production"}'
```
