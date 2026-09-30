import { NextResponse } from 'next/server';
import { localEVM } from '@/lib/blockchain/evm';

export async function GET() {
  const status = localEVM.getNetworkStatus();
  const contracts = localEVM.getContracts();

  return NextResponse.json({
    status,
    contracts,
  });
}
