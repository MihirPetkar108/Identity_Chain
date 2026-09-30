import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { didService } from '@/lib/auth/did';
import { localEVM } from '@/lib/blockchain/evm';
import db from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');

  if (owner) {
    const nfts = db.prepare('SELECT * FROM nfts WHERE LOWER(owner_address) = LOWER(?) ORDER BY token_id DESC').all(owner);
    return NextResponse.json({ nfts });
  }

  // Check if session user
  const session = await authService.getSession();
  if (session) {
    const did = await didService.getOrCreateDID(session.id);
    const userNfts = db.prepare('SELECT * FROM nfts WHERE LOWER(owner_address) = LOWER(?) OR LOWER(minter_address) = LOWER(?) ORDER BY token_id DESC').all(did.controller, did.controller);
    const allNfts = db.prepare('SELECT * FROM nfts ORDER BY token_id DESC LIMIT 50').all();
    return NextResponse.json({ userNfts, allNfts, controller: did.controller });
  }

  const allNfts = db.prepare('SELECT * FROM nfts ORDER BY token_id DESC LIMIT 50').all();
  return NextResponse.json({ allNfts });
}
