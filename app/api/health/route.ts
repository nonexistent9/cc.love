import { NextResponse } from 'next/server';

export async function GET() {
  const timestamp = new Date().toISOString();
  
  return NextResponse.json({
    status: 'healthy',
    timestamp,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
}

