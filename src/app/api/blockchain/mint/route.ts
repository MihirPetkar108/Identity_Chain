import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { didService } from '@/lib/auth/did';
import { localEVM } from '@/lib/blockchain/evm';

export async function POST(req: Request) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required. Please sign in to mint NFTs.' }, { status: 401 });
    }

    const { recipient, name, description, uri } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Asset name is required' }, { status: 400 });
    }

    const didProfile = await didService.getOrCreateDID(session.id);
    const callerAddress = didProfile.controller;
    const recipientAddress = recipient && recipient.trim() !== '' ? recipient.trim() : callerAddress;

    // Ensure DID is enrolled on-chain in IdentityRegistry
    if (!localEVM.isEnrolled(callerAddress)) {
      try {
        await localEVM.enrollIdentity(callerAddress, didProfile.did, callerAddress);
      } catch {}
    }

    // Smart contract execution
    const result = await localEVM.mintNFT(
      callerAddress,
      recipientAddress,
      name,
      description || '',
      uri || ''
    );

    return NextResponse.json({
      success: true,
      tokenId: result.tokenId,
      receipt: result.receipt,
      minter: callerAddress,
      recipient: recipientAddress,
      name,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Minting failed' }, { status: 400 });
  }
}
