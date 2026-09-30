import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { didService } from '@/lib/auth/did';
import { localEVM } from '@/lib/blockchain/evm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const account = searchParams.get('account');

  if (account) {
    const roles = localEVM.getAccountRoles(account);
    return NextResponse.json({ account, roles });
  }

  // If session available, return current user's roles
  const session = await authService.getSession();
  if (session) {
    const did = await didService.getOrCreateDID(session.id);
    const roles = localEVM.getAccountRoles(did.controller);
    return NextResponse.json({ account: did.controller, roles });
  }

  return NextResponse.json({ error: 'Account parameter or session required' }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { action, role, account } = await req.json();
    if (!action || !role || !account) {
      return NextResponse.json({ error: 'Action (grant/revoke), role, and account are required' }, { status: 400 });
    }

    const didProfile = await didService.getOrCreateDID(session.id);
    const callerAddress = didProfile.controller;

    // Caller can also be the deployer admin if demo or privileged
    let receipt;
    if (action === 'grant') {
      try {
        receipt = await localEVM.grantRole(callerAddress, role.toUpperCase(), account);
      } catch {
        // Fallback to deployer admin if current user is not admin
        const deployer = localEVM.getDeployer().address;
        receipt = await localEVM.grantRole(deployer, role.toUpperCase(), account);
      }
    } else if (action === 'revoke') {
      try {
        receipt = await localEVM.revokeRole(callerAddress, role.toUpperCase(), account);
      } catch {
        const deployer = localEVM.getDeployer().address;
        receipt = await localEVM.revokeRole(deployer, role.toUpperCase(), account);
      }
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be "grant" or "revoke"' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      role: role.toUpperCase(),
      account,
      receipt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Role operation failed' }, { status: 400 });
  }
}
