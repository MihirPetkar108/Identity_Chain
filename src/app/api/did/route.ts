import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { didService } from '@/lib/auth/did';
import { localEVM } from '@/lib/blockchain/evm';

export async function GET() {
  const session = await authService.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const did = await didService.getOrCreateDID(session.id);
  const roles = localEVM.getAccountRoles(did.controller);

  return NextResponse.json({
    did,
    roles,
    enrolledOnChain: did.enrolledOnChain,
  });
}

export async function POST(req: Request) {
  const session = await authService.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { didIdentifier, controllerAddress } = await req.json();
  const currentDid = await didService.getOrCreateDID(session.id);

  const targetDid = didIdentifier || currentDid.did;
  const targetController = controllerAddress || currentDid.controller;

  // Execute on smart contract
  try {
    const receipt = await localEVM.enrollIdentity(currentDid.controller, targetDid, targetController);
    return NextResponse.json({
      success: true,
      receipt,
      did: targetDid,
      controller: targetController,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
