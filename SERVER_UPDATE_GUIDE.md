# Next.js Server Update Guide: Multipart Frame Uploads

## Overview

Your iOS app now sends screen recording frames as **multipart/form-data** instead of base64 JSON.

**What changed:**
- ❌ Old: `POST` with JSON body `{"frame": "base64...", "timestamp": 123, ...}`
- ✅ New: `POST` with multipart/form-data containing binary JPEG + metadata fields

**Benefits:**
- 33% smaller payloads (200-400KB vs 270-540KB)
- No base64 encoding/decoding overhead
- Standard HTTP multipart approach

---

## What the Server Receives

### Request Details

**Endpoint:** `POST /api/message`

**Content-Type:** `multipart/form-data; boundary=Boundary-XXXXXXXX`

**Form Fields:**
- `frame` - Binary JPEG file (200-400KB), filename: `frameN.jpg`
- `timestamp` - Unix milliseconds as string (e.g., `"1729876543210"`)
- `frameNumber` - Sequence number as string (e.g., `"5"`)
- `format` - Always `"jpeg"`

---

## Implementation Options

Choose the option that matches your Next.js setup:

### Option 1: Pages Router with `formidable` (Recommended)

**For:** `pages/api/message.ts` or `pages/api/message.js`

#### Step 1: Install Dependencies

```bash
npm install formidable
npm install --save-dev @types/formidable
```

#### Step 2: Create/Update API Route

```typescript
// pages/api/message.ts
import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';

// Disable Next.js default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Parse error:', err);
      return res.status(500).json({ error: 'Upload failed', details: err.message });
    }

    try {
      // Extract fields (formidable v3 returns arrays)
      const frameFile = Array.isArray(files.frame) ? files.frame[0] : files.frame;
      const timestamp = Array.isArray(fields.timestamp) ? fields.timestamp[0] : fields.timestamp;
      const frameNumber = Array.isArray(fields.frameNumber) ? fields.frameNumber[0] : fields.frameNumber;
      const format = Array.isArray(fields.format) ? fields.format[0] : fields.format;

      if (!frameFile) {
        return res.status(400).json({ error: 'No frame uploaded' });
      }

      console.log('📸 Received frame:', {
        frameNumber,
        timestamp,
        format,
        size: frameFile.size,
        originalFilename: frameFile.originalFilename,
        filepath: frameFile.filepath,
      });

      // Read the file buffer
      const buffer = await fs.promises.readFile(frameFile.filepath);

      // ===== YOUR PROCESSING LOGIC HERE =====
      // Examples:
      // 1. Save to cloud storage (S3, Cloudinary, etc.)
      // 2. Process with AI/ML
      // 3. Save to database
      // 4. Stream to another service
      // =====================================

      // Example: Save to public directory
      // const publicPath = `./public/frames/frame-${frameNumber}.jpg`;
      // await fs.promises.writeFile(publicPath, buffer);

      // Clean up temp file
      await fs.promises.unlink(frameFile.filepath);

      return res.status(200).json({
        success: true,
        frameNumber: parseInt(frameNumber || '0'),
        timestamp: parseInt(timestamp || '0'),
        receivedSize: frameFile.size,
        format,
      });
    } catch (error: any) {
      console.error('Processing error:', error);
      return res.status(500).json({ error: 'Processing failed', details: error.message });
    }
  });
}
```

---

### Option 2: App Router (Next.js 13+)

**For:** `app/api/message/route.ts`

#### Step 1: No Dependencies Needed!

Next.js 13+ has built-in FormData support.

#### Step 2: Create/Update API Route

```typescript
// app/api/message/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

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

    console.log('📸 Received frame:', {
      frameNumber,
      timestamp,
      format,
      size: frameFile.size,
      filename: frameFile.name,
      type: frameFile.type,
    });

    // Convert file to buffer
    const arrayBuffer = await frameFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ===== YOUR PROCESSING LOGIC HERE =====
    // Examples:
    // 1. Save to cloud storage
    // 2. Process with AI/ML
    // 3. Save to database
    // =====================================

    // Example: Save to filesystem (not recommended for production)
    // import fs from 'fs/promises';
    // await fs.writeFile(`./public/frames/frame-${frameNumber}.jpg`, buffer);

    return NextResponse.json({
      success: true,
      frameNumber: parseInt(frameNumber || '0'),
      timestamp: parseInt(timestamp || '0'),
      receivedSize: frameFile.size,
      format,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### Option 3: App Router with Vercel Blob Storage (Production)

**For:** Large-scale deployments

#### Step 1: Install Vercel Blob

```bash
npm install @vercel/blob
```

#### Step 2: Create API Route

```typescript
// app/api/message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

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

    // Upload to Vercel Blob Storage
    const blob = await put(`frames/frame-${frameNumber}-${timestamp}.jpg`, frameFile, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('📸 Frame uploaded to blob:', {
      frameNumber,
      timestamp,
      url: blob.url,
      size: frameFile.size,
    });

    return NextResponse.json({
      success: true,
      frameNumber: parseInt(frameNumber || '0'),
      timestamp: parseInt(timestamp || '0'),
      url: blob.url,
      size: frameFile.size,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}

// Optional: Set runtime and max duration
export const runtime = 'edge'; // or 'nodejs'
export const maxDuration = 30; // seconds
```

**Environment Setup:**

Add to `.env`:
```bash
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

---

## Testing

### Test with cURL

```bash
# Create a test image
curl -o test.jpg "https://via.placeholder.com/800x600.jpg"

# Test your endpoint
curl -X POST \
  -F "frame=@test.jpg" \
  -F "timestamp=1729876543210" \
  -F "frameNumber=1" \
  -F "format=jpeg" \
  https://cc-love.vercel.app/api/message
```

**Expected Response:**

```json
{
  "success": true,
  "frameNumber": 1,
  "timestamp": 1729876543210,
  "receivedSize": 250000,
  "format": "jpeg"
}
```

### Test with Postman

1. Create new POST request to `https://cc-love.vercel.app/api/message`
2. Go to **Body** tab
3. Select **form-data**
4. Add fields:
   - `frame` (File) - Upload a JPEG image
   - `timestamp` (Text) - `1729876543210`
   - `frameNumber` (Text) - `1`
   - `format` (Text) - `jpeg`
5. Send request

---

## Integration Examples

### Save to Database (Prisma)

```typescript
// app/api/message/route.ts
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const frameFile = formData.get('frame') as File;
  const frameNumber = formData.get('frameNumber') as string;
  const timestamp = formData.get('timestamp') as string;

  // Upload to blob storage
  const blob = await put(`frames/frame-${frameNumber}.jpg`, frameFile, {
    access: 'public',
  });

  // Save metadata to database
  await prisma.frame.create({
    data: {
      frameNumber: parseInt(frameNumber),
      timestamp: new Date(parseInt(timestamp)),
      url: blob.url,
      size: frameFile.size,
      format: 'jpeg',
    },
  });

  return NextResponse.json({ success: true, url: blob.url });
}
```

### Process with AI (OpenAI Vision)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const frameFile = formData.get('frame') as File;

  // Convert to base64 for OpenAI API (they require it)
  const arrayBuffer = await frameFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString('base64');

  // Analyze with GPT-4 Vision
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What do you see in this screen recording frame?' },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });

  return NextResponse.json({
    success: true,
    analysis: response.choices[0].message.content,
  });
}
```

---

## Error Handling

### Common Issues

**1. "Unexpected end of form" error**
- Check that Content-Type header includes boundary
- Verify multipart body is properly formatted

**2. Files object is empty**
- Ensure `bodyParser: false` in config (Pages Router)
- Check field name is exactly `"frame"`

**3. Large file errors**
- Increase body size limit in `next.config.js`:

```javascript
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Adjust as needed
    },
  },
};
```

For App Router, configure in route:
```typescript
export const maxDuration = 60; // seconds
```

---

## Deployment Notes

### Vercel

- Default max payload: 4.5 MB (sufficient for our ~400KB frames)
- Max execution time: 10s (Hobby), 60s (Pro)
- Works with all options above

### Environment Variables

If using Vercel Blob:
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_***
```

---

## Performance Tips

1. **Stream Processing**: For large volumes, process frames asynchronously
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Compression**: Frames are already JPEG compressed at 75%
4. **CDN**: Use Vercel Blob or S3 with CloudFront for global distribution

---

## Migration Checklist

- [ ] Choose implementation option (Pages Router / App Router / Blob)
- [ ] Install required dependencies
- [ ] Update API route code
- [ ] Test with cURL or Postman
- [ ] Deploy to production
- [ ] Test with iOS app
- [ ] Monitor logs for errors
- [ ] Set up error tracking (Sentry, etc.)

---

## Questions?

Common questions:

**Q: Can I still accept the old base64 format for backward compatibility?**
A: Yes, check `Content-Type` header and route accordingly:

```typescript
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    // Handle multipart (new)
    const formData = await request.formData();
    // ...
  } else if (contentType.includes('application/json')) {
    // Handle JSON (old)
    const body = await request.json();
    // ...
  }
}
```

**Q: How do I handle multiple files?**
A: Currently sending one frame per request. For batch uploads, modify iOS code to send multiple files.

**Q: What about security?**
A: Add authentication:

```typescript
const authToken = request.headers.get('authorization');
if (authToken !== `Bearer ${process.env.API_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Summary

Your Next.js endpoint now receives:
- ✅ Binary JPEG files (33% smaller than base64)
- ✅ Metadata as form fields
- ✅ Standard HTTP multipart/form-data

Choose the implementation that fits your stack and deploy!
