'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Key, Box, Activity, ArrowRight, CheckCircle2, XCircle, Terminal, Layers, Cpu, Lock, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/contracts/status')
      .then((res) => res.json())
      .then((data) => setNetworkInfo(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="border border-zinc-200/90 bg-white rounded-xl p-6 sm:p-10 shadow-2xs">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            SIH125 Working Prototype
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-sans leading-tight">
            Decentralized Identity & Smart Contract Asset Platform
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            A deterministic Web3 architecture combining decentralized identity (DID), smart-contract-authorized asset operations, local EVM event ingestion, rolling 10-minute activity feature extraction, and an advisory Auditor Risk Panel.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auditor"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-zinc-200 bg-white text-zinc-800 text-xs font-medium hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Auditor Risk Panel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Network & Smart Contracts Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-zinc-200/90 bg-white rounded-lg p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
              <Cpu className="w-4 h-4 text-zinc-600" />
              <span>Network State</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ACTIVE
            </span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-0.5">
              <span className="text-zinc-500">Chain:</span>
              <span className="font-semibold text-zinc-900">Local EVM (31337)</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-zinc-500">Block Height:</span>
              <span className="text-zinc-900">#{networkInfo?.status?.blockNumber || 1000}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-zinc-500">Events Mined:</span>
              <span className="text-zinc-900">{networkInfo?.status?.totalEventsMined || 0}</span>
            </div>
          </div>
        </div>

        <div className="border border-zinc-200/90 bg-white rounded-lg p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
              <Layers className="w-4 h-4 text-zinc-600" />
              <span>Smart Contracts</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
              3 Verified
            </span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-0.5">
              <span className="text-zinc-500">IdentityRegistry:</span>
              <span className="text-zinc-800 truncate max-w-[140px]">
                {networkInfo?.status?.identityRegistryAddress ? `${networkInfo.status.identityRegistryAddress.slice(0, 8)}...` : '0x...'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-zinc-500">RoleManager:</span>
              <span className="text-zinc-800 truncate max-w-[140px]">
                {networkInfo?.status?.roleManagerAddress ? `${networkInfo.status.roleManagerAddress.slice(0, 8)}...` : '0x...'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-zinc-500">AssetNFT:</span>
              <span className="text-zinc-800 truncate max-w-[140px]">
                {networkInfo?.status?.assetNFTAddress ? `${networkInfo.status.assetNFTAddress.slice(0, 8)}...` : '0x...'}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-zinc-200/90 bg-white rounded-lg p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
              <Lock className="w-4 h-4 text-zinc-600" />
              <span>Authorization Boundary</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
              ENFORCED
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-sans">
            <div className="flex items-center gap-2 py-0.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Smart Contracts: Sole Authorization Layer</span>
            </div>
            <div className="flex items-center gap-2 py-0.5 text-zinc-600">
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>AI / ML Risk: Strictly Advisory Only</span>
            </div>
            <p className="text-[11px] text-zinc-400 pt-0.5 leading-snug">
              Smart contracts remain the exclusive authorization boundary on-chain.
            </p>
          </div>
        </div>
      </div>

      {/* Core Architecture Pipeline Flow */}
      <div className="border border-zinc-200/90 bg-white rounded-xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-zinc-950 font-sans">End-to-End System Pipeline</h2>
            <p className="text-xs text-zinc-500">Autonomous verification and feature analysis sequence</p>
          </div>
          <span className="text-[10px] font-mono bg-zinc-50 border border-zinc-200 text-zinc-700 px-2 py-1 rounded-md">
            5 Core Stages
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold">STAGE 01</span>
              <Shield className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <div className="font-semibold text-zinc-900 font-sans">User Auth & Session</div>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">Bcrypt password hashing & JWT session persistence</p>
          </div>

          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold">STAGE 02</span>
              <Key className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <div className="font-semibold text-zinc-900 font-sans">DID Identity Binding</div>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">User → DID → Controller separation & on-chain enrollment</p>
          </div>

          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold">STAGE 03</span>
              <Lock className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <div className="font-semibold text-zinc-900 font-sans">Smart Contract Auth</div>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">Solidity contracts verify DID and MINTER_ROLE permissions</p>
          </div>

          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold">STAGE 04</span>
              <Activity className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <div className="font-semibold text-zinc-900 font-sans">EVM Event Stream</div>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">Logs normalized into activity events in SQLite database</p>
          </div>

          <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-500 font-bold">STAGE 05</span>
              <Terminal className="w-3.5 h-3.5 text-indigo-700" />
            </div>
            <div className="font-semibold text-zinc-900 font-sans">10-Min Risk Panel</div>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">Rule Engine + Isolation Forest synthetic advisory assessment</p>
          </div>
        </div>
      </div>

      {/* Navigation Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard"
          className="group block p-5 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-md bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-zinc-950">User Workspace</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            View associated DID document, controller address, verified roles, and owned verifiable assets.
          </p>
        </Link>

        <Link
          href="/mint"
          className="group block p-5 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-md bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Box className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-zinc-950">Assets & Credentials</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Create verifiable digital assets and execute smart-contract transfers on the local EVM.
          </p>
        </Link>

        <Link
          href="/auditor"
          className="group block p-5 rounded-lg border border-indigo-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-md bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Activity className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-sm font-bold text-zinc-950">Auditor Risk Panel</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Inspect live 10-minute rolling features, transparent rule evaluations, deviations, and demo triggers.
          </p>
        </Link>
      </div>
    </div>
  );
}
