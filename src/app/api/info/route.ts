import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appInfo = {
      name: 'Astral Field',
      version: '1.0.0',
      description: 'Fantasy football management platform',
      status: 'active',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: {
        authentication: true,
        leagues: true,
        drafting: true,
        trading: true,
        analytics: true
      }
    };

    return NextResponse.json(appInfo);
  } catch {
    return NextResponse.json(
      { error: 'Failed to get app info' },
      { status: 500 }
    );
  }
}
