import { NextResponse } from 'next/server';
import { isTryOnEnabled } from '@/lib/env';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    services: {
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      tryon: isTryOnEnabled,
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
