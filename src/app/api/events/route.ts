import { NextResponse } from 'next/server';
import { eventCollector } from '@/lib/blockchain/collector';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const actor = searchParams.get('actor') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
  const since = searchParams.get('since') ? parseInt(searchParams.get('since')!) : undefined;

  const events = eventCollector.getEvents({ actor, limit, since });

  return NextResponse.json({
    count: events.length,
    events,
  });
}
