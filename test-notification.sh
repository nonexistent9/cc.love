#!/bin/bash

# Test script for AI-powered push notifications via /api/message endpoint
#
# This script sends a test image to the /api/message endpoint to trigger
# the AI analysis which can then send push notifications if it detects
# something important.
#
# Usage:
#   ./test-notification.sh [image_path]
#
# If no image path is provided, it will create a simple test image.

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/message}"
IMAGE_PATH="${1}"

echo "🧪 Testing AI-powered push notifications"
echo "========================================"
echo ""

# Create a test image if none provided
if [ -z "$IMAGE_PATH" ]; then
  echo "📸 No image provided, creating test image..."

  # Check if ImageMagick is available
  if command -v convert &> /dev/null; then
    # Create a test image with some text that might trigger a notification
    TEST_IMAGE="/tmp/test-frame-$(date +%s).jpg"
    convert -size 800x600 xc:white \
      -gravity center \
      -pointsize 48 \
      -fill red \
      -annotate +0-100 "🚨 CRITICAL ERROR" \
      -pointsize 32 \
      -fill black \
      -annotate +0+0 "System Failure Detected" \
      -annotate +0+50 "Please notify all users immediately" \
      "$TEST_IMAGE"
    IMAGE_PATH="$TEST_IMAGE"
    echo "✓ Created test image: $TEST_IMAGE"
  else
    echo "❌ Error: No image provided and ImageMagick not available"
    echo "   Please provide an image path or install ImageMagick"
    echo "   Usage: ./test-notification.sh /path/to/image.jpg"
    exit 1
  fi
fi

# Check if image exists
if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ Error: Image file not found: $IMAGE_PATH"
  exit 1
fi

echo "🖼️  Using image: $IMAGE_PATH"
echo "🌐 API URL: $API_URL"
echo ""

# Send the request
echo "📤 Sending frame to API..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -F "frame=@$IMAGE_PATH" \
  -F "timestamp=$(date +%s)000" \
  -F "frameNumber=1" \
  -F "format=jpeg")

echo ""
echo "📥 Response:"
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

# Check if notification was sent
if echo "$RESPONSE" | jq -e '.toolCalls[]? | select(.tool == "sendPushNotification")' > /dev/null 2>&1; then
  echo ""
  echo "✅ Push notification was sent by the AI!"
  echo ""
  echo "Notification details:"
  echo "$RESPONSE" | jq '.toolCalls[]? | select(.tool == "sendPushNotification")'
else
  echo ""
  echo "ℹ️  No push notification was triggered by the AI"
  echo "   The AI determines when notifications are important based on the image content"
fi

# Cleanup temp file if we created it
if [ ! -z "$TEST_IMAGE" ] && [ -f "$TEST_IMAGE" ]; then
  rm "$TEST_IMAGE"
  echo ""
  echo "🧹 Cleaned up test image"
fi
