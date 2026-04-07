import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return Response.json({
    success: true,
    service: 'unifesto-api',
    status: 'ok',
    origin: request.headers.get('origin') ?? null,
    timestamp: new Date().toISOString(),
  });
}
