import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { didService } from '@/lib/auth/did';
import { localEVM } from '@/lib/blockchain/evm';

export async function POST(req: Request) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { did, controller } = await req.json();
    if (!did || !controller) {
      return NextResponse.json({ error: 'DID and controller address are required' }, { status: 400 });
    }

    const didProfile = await didService.getOrCreateDID(session.id);
    const callerAddress = didProfile.controller;

    const receipt = await localEVM.enrollIdentity(callerAddress, did, controller);

    return NextResponse.json({
      success: true,
      did,
      controller,
      receipt,
      enrolledAt: Math.floor(Date.now() / 1000),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Identity enrollment failed' }, { status: 400 });
  }
}
