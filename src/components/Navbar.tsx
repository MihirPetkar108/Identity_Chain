'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Key, Activity, Box, LogOut, LogIn, UserPlus, Copy, Check } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<{ authenticated: boolean; user?: any; did?: any } | null>(null);
  const [networkStatus, setNetworkStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSession();
    fetchNetwork();
    const interval = setInterval(fetchNetwork, 4000);
    return () => clearInterval(interval);
  }, [pathname]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setSession(data);
    } catch {
      setSession({ authenticated: false });
    }
  };

  const fetchNetwork = async () => {
    try {
      const res = await fetch('/api/contracts/status');
      const data = await res.json();
      setNetworkStatus(data.status);
    } catch {}
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
    router.push('/login');
    router.refresh();
  };

  const copyController = () => {
    if (session?.did?.controller) {
      navigator.clipboard.writeText(session.did.controller);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Shield },
    { href: '/identity', label: 'Identity', icon: Key },
    { href: '/mint', label: 'Assets', icon: Box },
    { href: '/auditor', label: 'Auditor', icon: Activity },
  ];

  const shortenAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 text-zinc-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand Logo & EVM Network Pill */}
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center font-mono text-xs font-semibold tracking-wider transition-transform group-hover:scale-105 shadow-xs">
                IC
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-zinc-950 leading-tight">Identity Chain</span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-normal leading-tight">SIH125 Prototype</span>
              </div>
            </Link>

            {/* EVM Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-zinc-50 border border-zinc-200/90 rounded-md text-xs font-mono text-zinc-700 select-none">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-zinc-900">Local EVM</span>
              <span className="text-zinc-300">/</span>
              <span className="text-zinc-600">#{networkStatus?.blockNumber || 1000}</span>
              <span className="text-zinc-300">/</span>
              <span className="text-zinc-500">{networkStatus?.totalEventsMined || 0} evts</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href === '/mint' && pathname === '/assets');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Auth Section */}
          <div className="flex items-center gap-3">
            {session?.authenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-medium text-zinc-900">{session.user.name}</span>
                  </div>
                  <button
                    onClick={copyController}
                    className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 flex items-center gap-1 justify-end transition-colors"
                    title="Click to copy full controller address"
                  >
                    <span>{shortenAddress(session.did?.controller)}</span>
                    {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 opacity-50" />}
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-200/90 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/80 text-xs font-medium transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-zinc-700 hover:bg-zinc-100 text-xs font-medium transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium transition-colors shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
      
      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-200/80 py-2 bg-white/95">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href === '/mint' && pathname === '/assets');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                isActive ? 'text-zinc-950 font-bold' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
