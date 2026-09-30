'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Send,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  ShieldCheck,
  ArrowRight,
  Clock,
  ExternalLink,
  ChevronRight,
  FileCode,
  X,
  Cpu,
} from 'lucide-react';

function MintContent() {
  const searchParams = useSearchParams();
  const prefillTokenId = searchParams.get('transferTokenId') || '';

  const [profile, setProfile] = useState<any>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mint Form State
  const [mintName, setMintName] = useState('Verifiable Asset Certificate #101');
  const [mintDesc, setMintDesc] = useState('Proof of credential ownership issued under verified DID authority');
  const [mintRecipient, setMintRecipient] = useState('');
  const [mintUri, setMintUri] = useState('ipfs://bafybeicredential101');
  const [mintLoading, setMintLoading] = useState(false);
  const [mintStep, setMintStep] = useState<number>(0);
  const [mintSuccess, setMintSuccess] = useState<any>(null);
  const [mintError, setMintError] = useState('');

  // Selected Asset Details Modal State
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Transfer Modal State
  const [transferModalAsset, setTransferModalAsset] = useState<any>(null);
  const [transferRecipient, setTransferRecipient] = useState('0x90F79bf6EB2c4f870365E785982E1f101E93b906');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<any>(null);
  const [transferError, setTransferError] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.authenticated) {
        window.location.href = '/login';
        return;
      }
      setProfile(data);

      const netRes = await fetch('/api/contracts/status');
      const netData = await netRes.json();
      setNetworkInfo(netData.status);

      if (data.did?.controller) {
        setMintRecipient(data.did.controller);
        const nftRes = await fetch(`/api/blockchain/nfts?owner=${data.did.controller}`);
        const nftData = await nftRes.json();
        const userAssets = nftData.nfts || [];
        setNfts(userAssets);

        if (prefillTokenId) {
          const matched = userAssets.find((n: any) => String(n.token_id) === String(prefillTokenId));
          if (matched) {
            setTransferModalAsset(matched);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const shortenAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const shortenHash = (hash?: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMintLoading(true);
    setMintError('');
    setMintSuccess(null);
    setMintStep(1); // 1. Preparing transaction

    try {
      await new Promise((r) => setTimeout(r, 200));
      setMintStep(2); // 2. Verifying DID
      await new Promise((r) => setTimeout(r, 200));
      setMintStep(3); // 3. Checking smart-contract authorization
      await new Promise((r) => setTimeout(r, 250));
      setMintStep(4); // 4. Executing transaction

      const res = await fetch('/api/blockchain/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mintName,
          description: mintDesc,
          recipient: mintRecipient,
          uri: mintUri,
        }),
      });

      setMintStep(5); // 5. Confirming block
      await new Promise((r) => setTimeout(r, 200));

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Asset creation failed');

      setMintStep(6); // 6. Asset created
      setMintSuccess(data);
      loadData();
    } catch (err: any) {
      setMintError(err.message || 'Asset creation error');
      setMintStep(0);
    } finally {
      setMintLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalAsset) return;

    setTransferLoading(true);
    setTransferError('');
    setTransferSuccess(null);

    try {
      const res = await fetch('/api/blockchain/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: transferModalAsset.token_id,
          recipient: transferRecipient,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transfer failed');

      setTransferSuccess(data);
      loadData();
    } catch (err: any) {
      setTransferError(err.message || 'Transfer error');
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-zinc-500 text-xs font-mono">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading verifiable asset registry...
      </div>
    );
  }

  const stepsList = [
    'Preparing transaction',
    'Verifying DID',
    'Checking smart-contract authorization',
    'Executing transaction',
    'Confirming block',
    'Asset created',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold text-zinc-950 font-sans tracking-tight">Assets & Verifiable Credentials</h1>
          <p className="text-xs text-zinc-500">Create, inspect and transfer DID-authorized digital assets on the local EVM.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Create Verifiable Asset (5 cols) */}
        <div className="lg:col-span-5 border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-950 font-sans">Create Verifiable Asset</h2>
            </div>
            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">EVM ERC-721</span>
          </div>

          {/* Authorization Status Card */}
          <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs space-y-1 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                DID VERIFIED
              </span>
              <span className="text-[10px] text-zinc-500">Controller Authorized</span>
            </div>
            <div className="text-[11px] text-zinc-700 truncate">
              Controller: <span className="font-semibold text-zinc-950">{shortenAddress(profile?.did?.controller)}</span>
            </div>
          </div>

          {/* Transaction Progress Lifecycle Indicator */}
          {mintLoading && (
            <div className="p-4 rounded-md bg-zinc-900 text-white space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>LIFECYCLE PROGRESS</span>
                <span>STEP {mintStep} OF 6</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(mintStep / 6) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{stepsList[mintStep - 1] || 'Processing...'}</span>
              </div>
            </div>
          )}

          {/* Success Card */}
          {mintSuccess && (
            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 font-mono">
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Asset Created Successfully
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">
                  NFT #{mintSuccess.tokenId}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 space-y-0.5 pt-1 border-t border-emerald-200/60">
                <div>Transaction: <span className="font-semibold">{shortenHash(mintSuccess.receipt?.transactionHash)}</span></div>
                <div>Block: <span className="font-semibold">#{mintSuccess.receipt?.blockNumber}</span></div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const found = nfts.find((n) => n.token_id === mintSuccess.tokenId);
                    if (found) setSelectedAsset(found);
                    setMintSuccess(null);
                  }}
                  className="px-3 py-1 rounded bg-emerald-700 text-white text-[11px] font-sans font-medium hover:bg-emerald-800 transition-colors"
                >
                  View Asset
                </button>
              </div>
            </div>
          )}

          {mintError && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mintError}</span>
            </div>
          )}

          {/* Creation Form */}
          <form onSubmit={handleCreateAsset} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-zinc-700">Asset Name</label>
              <input
                type="text"
                required
                value={mintName}
                onChange={(e) => setMintName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="Verifiable Credential Certificate"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-zinc-700">Description</label>
              <textarea
                rows={2}
                value={mintDesc}
                onChange={(e) => setMintDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="Description of the digital asset or credential..."
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-zinc-700">Recipient Controller</label>
              <input
                type="text"
                required
                value={mintRecipient}
                onChange={(e) => setMintRecipient(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="0x..."
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-zinc-700">Metadata URI</label>
              <input
                type="text"
                value={mintUri}
                onChange={(e) => setMintUri(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="ipfs://bafybeig..."
              />
            </div>

            <button
              type="submit"
              disabled={mintLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 text-xs shadow-2xs mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{mintLoading ? 'Executing Smart Contract...' : 'Create Verifiable Asset'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: My Assets (7 cols) */}
        <div className="lg:col-span-7 border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-950 font-sans">My Assets ({nfts.length})</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Controller Holdings</span>
          </div>

          {nfts.length === 0 ? (
            <div className="p-10 text-center bg-zinc-50 rounded-md border border-dashed border-zinc-300">
              <Box className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs text-zinc-700 font-medium">No verifiable assets found for this controller.</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Use the form on the left to create your first verifiable asset.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {nfts.map((nft) => (
                <div
                  key={nft.id}
                  onClick={() => setSelectedAsset(nft)}
                  className="border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300 rounded-md p-3.5 space-y-2.5 cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-950">Asset #{nft.token_id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      Active
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 group-hover:text-zinc-950 truncate">{nft.name}</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {nft.description || 'No description'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                    <span>Owner: {shortenAddress(nft.owner_address)}</span>
                    <span className="text-zinc-900 font-medium flex items-center gap-0.5 group-hover:underline">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ASSET DETAILS MODAL / DRAWER */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
          <div className="border border-zinc-200 bg-white rounded-lg p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-950 font-sans">Asset Details — Token #{selectedAsset.token_id}</h3>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-zinc-400 hover:text-zinc-600 text-xs font-mono font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">ASSET NAME</span>
                <span className="text-zinc-950 font-sans font-bold text-sm">{selectedAsset.name}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">DESCRIPTION</span>
                <p className="text-zinc-600 font-sans text-xs mt-0.5">{selectedAsset.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-100">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">TOKEN ID</span>
                  <span className="font-bold text-zinc-950">#{selectedAsset.token_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">CONTRACT</span>
                  <span className="text-zinc-700 truncate block">{shortenAddress(networkInfo?.assetNFTAddress)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">CURRENT OWNER</span>
                  <span className="text-zinc-800 break-all select-all block bg-zinc-50 p-1.5 rounded border border-zinc-200 text-[11px] mt-0.5">
                    {selectedAsset.owner_address}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">ORIGINAL MINTER</span>
                  <span className="text-zinc-800 break-all select-all block bg-zinc-50 p-1.5 rounded border border-zinc-200 text-[11px] mt-0.5">
                    {selectedAsset.minter_address}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">TRANSACTION HASH</span>
                <span className="text-zinc-800 break-all select-all block bg-zinc-50 p-1.5 rounded border border-zinc-200 text-[11px] mt-0.5">
                  {selectedAsset.tx_hash}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">METADATA URI</span>
                <span className="text-zinc-600 break-all select-all block bg-zinc-50 p-1.5 rounded border border-zinc-200 text-[11px] mt-0.5">
                  {selectedAsset.token_uri}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-3.5 py-1.5 rounded-md border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTransferModalAsset(selectedAsset);
                  setSelectedAsset(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-2xs"
              >
                <Send className="w-3 h-3" />
                <span>Transfer Asset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER ASSET MODAL */}
      {transferModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
          <div className="border border-zinc-200 bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-950 font-sans">Transfer Verifiable Asset</h3>
              </div>
              <button
                onClick={() => {
                  setTransferModalAsset(null);
                  setTransferSuccess(null);
                  setTransferError('');
                }}
                className="text-zinc-400 hover:text-zinc-600 text-xs font-mono font-bold"
              >
                ✕
              </button>
            </div>

            {/* Asset Summary */}
            <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Asset:</span>
                <span className="font-bold text-zinc-950">#{transferModalAsset.token_id} — {transferModalAsset.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Current Owner:</span>
                <span className="text-zinc-800">{shortenAddress(transferModalAsset.owner_address)}</span>
              </div>
            </div>

            {/* Pre-Transfer Verification Checklist */}
            <div className="p-3 rounded-md bg-zinc-50/80 border border-zinc-200 space-y-1.5 text-[11px] font-mono">
              <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">AUTHORIZATION CHECKLIST</div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>DID Verified Controller</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Asset Ownership Confirmed On-Chain</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Smart Contract Authorization</span>
              </div>
            </div>

            {transferSuccess && (
              <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1 font-mono">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Transfer Completed!</span>
                </div>
                <div className="text-[11px] text-emerald-800">
                  Tx: <span className="font-semibold">{shortenHash(transferSuccess.receipt?.transactionHash)}</span>
                </div>
                <div className="text-[11px] text-emerald-800">
                  Block: <span className="font-semibold">#{transferSuccess.receipt?.blockNumber}</span>
                </div>
              </div>
            )}

            {transferError && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-700 font-medium">Recipient Address (0x...)</label>
                <input
                  type="text"
                  required
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                  placeholder="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalAsset(null)}
                  className="px-3.5 py-2 rounded-md border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{transferLoading ? 'Transferring on EVM...' : 'Transfer Asset'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MintPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-zinc-500 font-mono">Loading verifiable asset registry...</div>}>
      <MintContent />
    </Suspense>
  );
}
