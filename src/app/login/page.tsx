'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@identity.chain');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data = await res.json();

      if (!res.ok && (data.error?.includes('Invalid') || data.error?.includes('not exist'))) {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Demo Administrator', email, password }),
        });
        if (regRes.ok) {
          router.push('/dashboard');
          router.refresh();
          return;
        }
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 space-y-6">
      <div className="text-center space-y-1.5">
        <div className="w-9 h-9 rounded-md bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-xs mx-auto shadow-2xs">
          IC
        </div>
        <h1 className="text-xl font-bold text-zinc-950 font-sans tracking-tight">Application Sign In</h1>
        <p className="text-xs text-zinc-500">
          Access your decentralized identity workspace and smart contract assets.
        </p>
      </div>

      <div className="border border-zinc-200/90 bg-white rounded-xl p-6 shadow-2xs">
        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-300 text-zinc-900 text-xs font-mono"
                placeholder="user@identity.chain"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-zinc-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-300 text-zinc-900 text-xs"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 text-xs shadow-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Need an account?</span>
          <Link href="/signup" className="text-zinc-950 font-medium hover:underline">
            Create account
          </Link>
        </div>
      </div>

      <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 text-xs text-zinc-600 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
          <span>Application-level Auth Separation</span>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Application authentication uses standard web sessions. Your DID cryptographic key is managed separately and never exposed.
        </p>
      </div>
    </div>
  );
}
