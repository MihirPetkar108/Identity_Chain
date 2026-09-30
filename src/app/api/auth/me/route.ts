import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { didService } from '@/lib/auth/did';

export async function GET() {
  const session = await authService.getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  const did = await didService.getOrCreateDID(session.id);

  return NextResponse.json({
    authenticated: true,
    user: session,
    did,
  });
}
