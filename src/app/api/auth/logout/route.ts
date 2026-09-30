import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  res.cookies.delete(authService.getCookieName());
  return res;
}
