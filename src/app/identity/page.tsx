'use client';

import React, { useEffect, useState } from 'react';
import {
  Key,
  Shield,
  UserCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  ArrowRight,
  UserPlus,
  User,
  Cpu,
  Layers,
  FileCode,
} from 'lucide-react';

export default function IdentityPage() {
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Enroll Identity Form
  const [enrollDid, setEnrollDid] = useState('');
  const [enrollController, setEnrollController] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState<any>(null);
  const [enrollError, setEnrollError] = useState('');

  // Role Management Form
  const [targetAccount, setTargetAccount] = useState('');
  const [selectedRole, setSelectedRole] = useState('MINTER');
  const [roleAction, setRoleAction] = useState<'grant' | 'revoke'>('grant');
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSuccess, setRoleSuccess] = useState<any>(null);
  const [roleError, setRoleError] = useState('');

  const loadIdentity = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.authenticated) {
        window.location.href = '/login';
        return;
      }
      setProfile(data);

      if (data.did?.controller) {
        setTargetAccount(data.did.controller);
        const rRes = await fetch(`/api/blockchain/roles?account=${data.did.controller}`);
        const rData = await rRes.json();
        setRoles(rData.roles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdentity();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollLoading(true);
    setEnrollError('');
    setEnrollSuccess(null);

    try {
      const res = await fetch('/api/blockchain/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: enrollDid, controller: enrollController }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment failed');

      setEnrollSuccess(data);
      setEnrollDid('');
      setEnrollController('');
    } catch (err: any) {
      setEnrollError(err.message || 'Enrollment error');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleLoading(true);
    setRoleError('');
    setRoleSuccess(null);

    try {
      const res = await fetch('/api/blockchain/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: roleAction,
          role: selectedRole,
          account: targetAccount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Role operation failed');

      setRoleSuccess(data);
      loadIdentity();
    } catch (err: any) {
      setRoleError(err.message || 'Role operation error');
    } finally {
      setRoleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-zinc-500 text-xs font-mono">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading Decentralized Identity architecture...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold text-zinc-950 font-sans tracking-tight">Decentralized Identity & Roles</h1>
          <p className="text-xs text-zinc-500">W3C DID verification, cryptographic controller binding, and smart-contract access control</p>
        </div>
        <button
          onClick={loadIdentity}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* THREE-TIER IDENTITY ARCHITECTURE SEPARATION */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-bold text-zinc-950 font-sans">Three-Tier Identity Architecture</h2>
          </div>
          <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">Decoupled Security</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          
          {/* Tier 1: Application Identity */}
          <div className="p-4 rounded-md border border-zinc-200 bg-zinc-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">LAYER 01</span>
              <User className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="font-bold text-zinc-950 font-sans text-xs">Application Identity</div>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
              Standard bcrypt password hash & JWT session for web access. Never touches the blockchain private key.
            </p>
            <div className="pt-2 border-t border-zinc-200 text-[11px] text-zinc-700">
              User: <span className="font-semibold">{profile?.user?.name}</span>
            </div>
          </div>

          {/* Tier 2: DID Identity */}
          <div className="p-4 rounded-md border border-zinc-200 bg-zinc-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">LAYER 02</span>
              <Key className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="font-bold text-zinc-950 font-sans text-xs">DID Identity</div>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
              Cryptographic identifier bound to EVM controller address with secp256k1 verification method.
            </p>
            <div className="pt-2 border-t border-zinc-200 text-[11px] text-zinc-700 truncate">
              DID: <span className="font-semibold">{profile?.did?.did?.slice(0, 16)}...</span>
            </div>
          </div>

          {/* Tier 3: Smart Contract Roles */}
          <div className="p-4 rounded-md border border-zinc-200 bg-zinc-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">LAYER 03</span>
              <Shield className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="font-bold text-zinc-950 font-sans text-xs">Smart Contract Roles</div>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
              On-chain RBAC contract authorization governing asset creation and operations. Sole authoritative layer.
            </p>
            <div className="pt-2 border-t border-zinc-200 text-[11px] text-zinc-700">
              Roles: <span className="font-semibold">{roles.join(', ') || 'USER'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Active DID Document Details */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-bold text-zinc-950 font-sans">Active W3C DID Document</h2>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Enrolled in Smart Contract Registry
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">DID IDENTIFIER</span>
              <span className="text-zinc-900 break-all select-all block bg-zinc-50 p-2 rounded-md border border-zinc-200 mt-1">
                {profile?.did?.did}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">CONTROLLER ADDRESS</span>
              <span className="text-zinc-900 break-all select-all block bg-zinc-50 p-2 rounded-md border border-zinc-200 mt-1 font-semibold">
                {profile?.did?.controller}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">VERIFICATION METHOD</span>
                <span className="text-zinc-700 block bg-zinc-50 p-2 rounded-md border border-zinc-200 mt-1 text-[11px]">
                  {profile?.did?.verificationMethod}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">STATUS</span>
                <span className="text-emerald-700 block bg-emerald-50/70 p-2 rounded-md border border-emerald-200 mt-1 text-[11px] font-semibold">
                  ● Verified Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 text-zinc-100 rounded-md p-3.5 font-mono text-xs overflow-x-auto">
            <div className="text-[10px] text-zinc-400 pb-1 border-b border-zinc-800 mb-2 font-bold">RAW DID DOCUMENT</div>
            <pre className="text-[11px] leading-relaxed">
{`{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "${profile?.did?.did}",
  "controller": "${profile?.did?.controller}",
  "verificationMethod": [{
    "id": "${profile?.did?.did}#controller",
    "type": "EcdsaSecp256k1RecoveryMethod2020",
    "controller": "${profile?.did?.controller}",
    "blockchainAccountId": "eip155:31337:${profile?.did?.controller}"
  }],
  "authentication": ["${profile?.did?.did}#controller"],
  "assertionMethod": ["${profile?.did?.did}#controller"]
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Role Management & Identity Enrollment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Smart Contract Role Management */}
        <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-950 font-sans">Role Management</h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Smart Contract RBAC</span>
          </div>

          <div className="space-y-2 text-xs">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider font-mono block">ACTIVE ON-CHAIN ROLES</span>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <span key={r} className="px-2.5 py-1 rounded-md bg-zinc-900 text-white font-mono text-xs font-semibold">
                  {r}
                </span>
              ))}
              {roles.length === 0 && (
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 font-mono text-xs">
                  USER (Standard Authorization)
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleRoleChange} className="space-y-3 pt-2 text-xs border-t border-zinc-100">
            <h3 className="font-semibold text-zinc-900 font-sans">Update Role Assignment</h3>
            
            {roleError && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {roleError}
              </div>
            )}
            {roleSuccess && (
              <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono">
                ✓ Role {roleSuccess.action === 'grant' ? 'granted' : 'revoked'}: {roleSuccess.role} for {roleSuccess.account.slice(0, 8)}... (Tx: {roleSuccess.receipt?.transactionHash?.slice(0, 10)}...)
              </div>
            )}

            <div className="space-y-1">
              <label className="text-zinc-600 font-medium">Target Controller Address</label>
              <input
                type="text"
                required
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="0x..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-zinc-600 font-medium">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 font-mono text-xs bg-white"
                >
                  <option value="MINTER">MINTER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="AUDITOR">AUDITOR</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-600 font-medium">Action</label>
                <select
                  value={roleAction}
                  onChange={(e) => setRoleAction(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 font-mono text-xs bg-white"
                >
                  <option value="grant">Grant Role</option>
                  <option value="revoke">Revoke Role</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={roleLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 text-xs shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{roleLoading ? 'Submitting EVM Transaction...' : `${roleAction === 'grant' ? 'Grant' : 'Revoke'} Role On-Chain`}</span>
            </button>
          </form>
        </div>

        {/* 2. Identity Registry Enrollment */}
        <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-950 font-sans">Enroll Identity in Registry</h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Identity Registry</span>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            Register a new DID and controller pair on the blockchain. Identities enrolled within the past hour are monitored for activity risk analysis.
          </p>

          <form onSubmit={handleEnroll} className="space-y-3 text-xs">
            {enrollError && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {enrollError}
              </div>
            )}
            {enrollSuccess && (
              <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono">
                ✓ Identity enrolled on-chain! Controller: {enrollSuccess.controller.slice(0, 8)}... (Tx: {enrollSuccess.receipt?.transactionHash?.slice(0, 10)}...)
              </div>
            )}

            <div className="space-y-1">
              <label className="text-zinc-600 font-medium">DID String</label>
              <input
                type="text"
                required
                value={enrollDid}
                onChange={(e) => setEnrollDid(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="did:key:z6MkqZt8Wv9X8b2N4kL1f91F..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-600 font-medium">Controller Address (0x...)</label>
              <input
                type="text"
                required
                value={enrollController}
                onChange={(e) => setEnrollController(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 text-zinc-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="0xBcd4042DE499D14e55001CcbB24a551F3b954096"
              />
            </div>

            <button
              type="submit"
              disabled={enrollLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 text-xs shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{enrollLoading ? 'Executing Enrollment...' : 'Enroll Identity on EVM'}</span>
            </button>
          </form>

          <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-500 font-mono">
            ℹ Generates an on-chain event captured by the blockchain event listener.
          </div>
        </div>

      </div>
    </div>
  );
}
