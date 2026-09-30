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

    const { recipient, tokenId } = await req.json();
    if (!recipient || tokenId === undefined) {
      return NextResponse.json({ error: 'Recipient address and tokenId are required' }, { status: 400 });
    }

    const didProfile = await didService.getOrCreateDID(session.id);
    const callerAddress = didProfile.controller;

    // Smart contract transfer execution
    const receipt = await localEVM.transferNFT(callerAddress, recipient.trim(), Number(tokenId));

    return NextResponse.json({
      success: true,
      receipt,
      from: callerAddress,
      to: recipient.trim(),
      tokenId: Number(tokenId),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Transfer failed' }, { status: 400 });
  }
}
