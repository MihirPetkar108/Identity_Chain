'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Key,
  Box,
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Activity,
  RefreshCw,
  Cpu,
  Layers,
  Lock,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated) {
        window.location.href = '/login';
        return;
      }
      setProfile(meData);

      // Fetch network info
      const netRes = await fetch('/api/contracts/status');
      const netData = await netRes.json();
      setNetworkInfo(netData.status);

      if (meData.did?.controller) {
        // Fetch roles
        const roleRes = await fetch(`/api/blockchain/roles?account=${meData.did.controller}`);
        const roleData = await roleRes.json();
        setRoles(roleData.roles || []);

        // Fetch user NFTs
        const nftRes = await fetch(`/api/blockchain/nfts?owner=${meData.did.controller}`);
        const nftData = await nftRes.json();
        setNfts(nftData.nfts || []);

        // Fetch recent events for this user
        const evtRes = await fetch(`/api/events?actor=${meData.did.controller}&limit=6`);
        const evtData = await evtRes.json();
        setEvents(evtData.events || []);
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

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-zinc-500 text-xs font-mono">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading authenticated workspace...
      </div>
    );
  }

  const shortenHash = (hash?: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold text-zinc-950 font-sans tracking-tight">Security & Identity Dashboard</h1>
          <p className="text-xs text-zinc-500">Decentralized identifier binding, smart-contract asset holdings, and audit state</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            href="/mint"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Asset</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Identity Status */}
        <div className="border border-zinc-200 bg-white rounded-lg p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Identity (DID)</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Verified
            </span>
          </div>
          <div className="text-sm font-mono font-semibold text-zinc-950 truncate">
            {profile?.did?.did ? `${profile.did.did.slice(0, 16)}...` : 'did:ethr:...'}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 truncate">
            Ctrl: {profile?.did?.controller || '0x...'}
          </div>
        </div>

        {/* 2. Assets / NFTs */}
        <div className="border border-zinc-200 bg-white rounded-lg p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Verifiable Assets</span>
            <Box className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-zinc-950">
            {nfts.length} <span className="text-xs font-normal text-zinc-400 font-sans">owned</span>
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center justify-between">
            <span>On-chain ERC-721</span>
            <Link href="/mint" className="text-zinc-900 font-medium hover:underline flex items-center gap-0.5">
              <span>View</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* 3. Blockchain EVM State */}
        <div className="border border-zinc-200 bg-white rounded-lg p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Local EVM</span>
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-sm font-mono font-bold text-zinc-950">
            Block #{networkInfo?.blockNumber || 1000}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between">
            <span>3 Contracts deployed</span>
            <span className="text-zinc-700">{networkInfo?.totalEventsMined || 0} events</span>
          </div>
        </div>

        {/* 4. Risk / Auditor Status */}
        <div className="border border-zinc-200 bg-white rounded-lg p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Advisory Security</span>
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-mono text-sm font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Normal Profile</span>
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center justify-between">
            <span>AI: Advisory only</span>
            <Link href="/auditor" className="text-indigo-600 font-medium hover:underline flex items-center gap-0.5">
              <span>Auditor</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Main Two-Column Grid: DID Overview & Architecture Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left (2 cols): Identity & Roles Details */}
        <div className="lg:col-span-2 border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-950 font-sans">Decentralized Identity (DID) Profile</h2>
            </div>
            <Link href="/identity" className="text-xs text-zinc-600 hover:text-zinc-950 font-medium flex items-center gap-1">
              <span>Manage Identity</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">DID IDENTIFIER</span>
                <span className="text-zinc-900 break-all select-all block bg-zinc-50 p-2 rounded-md border border-zinc-200 mt-1">
                  {profile?.did?.did || 'Loading...'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">CONTROLLER ADDRESS</span>
                <span className="text-zinc-900 break-all select-all block bg-zinc-50 p-2 rounded-md border border-zinc-200 mt-1">
                  {profile?.did?.controller || '0x...'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">VERIFICATION METHOD</span>
                <span className="text-zinc-700 block bg-zinc-50 p-2 rounded-md border border-zinc-200 mt-1">
                  {profile?.did?.verificationMethod || 'did:key:secp256k1#controller'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">SMART CONTRACT ROLES</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <span key={r} className="px-2 py-0.5 rounded-md bg-zinc-900 text-white font-mono text-[11px] font-semibold">
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 font-mono text-[11px] text-zinc-600">
                      USER
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-mono text-[11px] text-emerald-700 font-medium">
                    ✓ Enrolled in Registry
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right (1 col): System Architecture Status Card */}
        <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-950 font-sans">System Boundaries</h2>
            </div>
            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded">STATUS</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-md bg-zinc-50 border border-zinc-200">
              <span className="font-medium text-zinc-700">App Authentication</span>
              <span className="text-emerald-700 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Authenticated
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md bg-zinc-50 border border-zinc-200">
              <span className="font-medium text-zinc-700">DID Identity</span>
              <span className="text-emerald-700 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Bound
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md bg-zinc-50 border border-zinc-200">
              <span className="font-medium text-zinc-700">Smart Contract Auth</span>
              <span className="text-emerald-700 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active (Sole Authority)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md bg-indigo-50/50 border border-indigo-200">
              <span className="font-medium text-zinc-800">AI / ML Risk Scoring</span>
              <span className="text-indigo-700 font-mono font-medium">
                Advisory only
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Owned Assets Grid */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-bold text-zinc-950 font-sans">Recent Owned Verifiable Assets</h2>
          </div>
          <Link href="/mint" className="text-xs text-zinc-600 hover:text-zinc-950 font-medium flex items-center gap-1">
            <span>Manage All Assets</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {nfts.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 rounded-md border border-dashed border-zinc-300">
            <Box className="w-7 h-7 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs text-zinc-700 font-medium">No verifiable assets held by your controller address.</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Mint an asset token with smart contract authorization.</p>
            <Link
              href="/mint"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Verifiable Asset</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.slice(0, 6).map((nft) => (
              <div key={nft.id} className="border border-zinc-200 bg-zinc-50/50 rounded-md p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-zinc-950">Asset #{nft.token_id}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 truncate">{nft.name}</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{nft.description || 'No description'}</p>
                </div>
                <div className="pt-2 border-t border-zinc-200 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                  <span>Tx: {shortenHash(nft.tx_hash)}</span>
                  <Link href={`/mint?transferTokenId=${nft.token_id}`} className="text-zinc-900 font-medium hover:underline flex items-center gap-0.5">
                    <span>Transfer</span>
                    <Send className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent On-Chain Activity Table */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-bold text-zinc-950 font-sans">Recent On-Chain Activity</h2>
          </div>
          <Link href="/auditor" className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
            <span>View Security Audit</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center font-mono">No recent transactions recorded for this controller.</p>
        ) : (
          <div className="divide-y divide-zinc-100 text-xs font-mono">
            {events.map((evt) => (
              <div key={evt.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    evt.type === 'NFT_MINT'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : evt.type.includes('TRANSFER')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {evt.type}
                  </span>
                  <span className="text-zinc-700 font-medium">Tx: {shortenHash(evt.transactionHash)}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Block #{evt.blockNumber} • {new Date(evt.timestamp * 1000).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
