'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
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
        <h1 className="text-xl font-bold text-zinc-950 font-sans tracking-tight">Create Account & DID</h1>
        <p className="text-xs text-zinc-500">
          Provision a new application user and automatically bind an on-chain DID identity.
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
            <label className="font-medium text-zinc-700">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-300 text-zinc-900 text-xs"
                placeholder="Dr. Jane Doe"
              />
            </div>
          </div>

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
                placeholder="jane@university.edu"
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
            {loading ? 'Provisioning DID & Account...' : 'Create Account & DID'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Already registered?</span>
          <Link href="/login" className="text-zinc-950 font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
