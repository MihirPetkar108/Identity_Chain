'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  FileCode,
  Info,
  Zap,
  Lock,
  User,
  ShieldAlert,
} from 'lucide-react';
import { DEMO_ACTORS } from '@/lib/constants';

export default function AuditorPage() {
  const [selectedActor, setSelectedActor] = useState<string>(DEMO_ACTORS.SUSPICIOUS_ACTOR);
  const [assessment, setAssessment] = useState<any>(null);
  const [availableActors, setAvailableActors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string>('');
  const [selectedEventModal, setSelectedEventModal] = useState<any>(null);

  const fetchAssessment = async (actorAddress?: string) => {
    const target = actorAddress || selectedActor;
    setLoading(true);
    try {
      const res = await fetch(`/api/auditor/assessment?actor=${target}`);
      const data = await res.json();
      setAssessment(data.assessment);
      setAvailableActors(data.availableActors || []);
      if (data.actor) {
        setSelectedActor(data.actor);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment(selectedActor);
  }, []);

  const handleTriggerDemo = async (action: 'normal' | 'suspicious' | 'reset') => {
    setDemoLoading(true);
    setDemoMessage('');
    try {
      const res = await fetch('/api/auditor/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'normal') {
          setDemoMessage('✓ Generated Normal Activity (Real EVM transactions executed on-chain)');
          setSelectedActor(DEMO_ACTORS.NORMAL_USER);
          await fetchAssessment(DEMO_ACTORS.NORMAL_USER);
        } else if (action === 'suspicious') {
          setDemoMessage('⚠ Generated Suspicious High-Frequency Burst (18 actions on EVM contracts)');
          setSelectedActor(DEMO_ACTORS.SUSPICIOUS_ACTOR);
          await fetchAssessment(DEMO_ACTORS.SUSPICIOUS_ACTOR);
        } else if (action === 'reset') {
          setDemoMessage('✓ Activity events and EVM state reset successfully');
          await fetchAssessment(DEMO_ACTORS.NORMAL_USER);
        }
      }
    } catch (err: any) {
      setDemoMessage(`Error: ${err.message}`);
    } finally {
      setDemoLoading(false);
    }
  };

  const features = assessment?.features || {};
  const triggeredRules = assessment?.triggeredRules || [];
  const largestDeviations = assessment?.largestDeviations || [];
  const eventsList = features.eventsList || [];

  const shortenAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const shortenHash = (hash?: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 12)}...${hash.slice(-6)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Console Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-zinc-900 text-white shadow-2xs">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-zinc-950 font-sans tracking-tight">Auditor Risk Panel</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
              AI / ML • ADVISORY ONLY
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Advisory behavioral analysis of blockchain activity.
          </p>
        </div>

        {/* Prototype Demo Controls */}
        <div className="bg-white p-2.5 rounded-lg border border-zinc-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Prototype Demo Controls
            </span>
            <span className="text-[9px] text-zinc-400 font-mono">Synthetic Data</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTriggerDemo('normal')}
              disabled={demoLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-emerald-600" />
              <span>Generate Normal Activity</span>
            </button>
            <button
              onClick={() => handleTriggerDemo('suspicious')}
              disabled={demoLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Zap className="w-3 h-3 text-amber-600" />
              <span>Generate Suspicious Activity</span>
            </button>
            <button
              onClick={() => handleTriggerDemo('reset')}
              disabled={demoLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium transition-colors disabled:opacity-50"
              title="Clear Activity"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Activity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Demo Notification / Toast */}
      {demoMessage && (
        <div className="p-3 rounded-md border text-xs font-mono bg-zinc-100 border-zinc-300 text-zinc-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-600 shrink-0" />
            <span>{demoMessage}</span>
          </div>
          <button onClick={() => setDemoMessage('')} className="text-zinc-400 hover:text-zinc-700 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Target Actor Selection Bar */}
      <div className="border border-zinc-200 bg-white rounded-lg p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <User className="w-4 h-4 text-zinc-500" />
          <span className="font-semibold text-zinc-800 font-sans">Target Actor:</span>
          <select
            value={selectedActor}
            onChange={(e) => {
              setSelectedActor(e.target.value);
              fetchAssessment(e.target.value);
            }}
            className="px-3 py-1.5 rounded-md border border-zinc-300 text-zinc-900 font-mono text-xs bg-zinc-50 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 max-w-xs sm:max-w-md"
          >
            {availableActors.map((actor) => (
              <option key={actor} value={actor}>
                {actor === DEMO_ACTORS.SUSPICIOUS_ACTOR
                  ? `${actor} (Demo Suspicious Actor)`
                  : actor === DEMO_ACTORS.NORMAL_USER
                  ? `${actor} (Demo Normal Actor)`
                  : actor}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Rolling Window: 10m (NOW - 600s)</span>
        </div>
      </div>

      {/* Top 4 Security Assessment Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Risk Score */}
        <div className="border border-zinc-200 bg-white rounded-lg p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Risk Score</span>
          <div className="text-2xl font-mono font-extrabold text-zinc-950">
            {assessment?.riskScore ?? 0} <span className="text-xs text-zinc-400 font-normal font-sans">/ 100</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Severity: <span className="font-bold text-zinc-900">{assessment?.severity || 'LOW'}</span>
          </div>
        </div>

        {/* 2. Anomaly Percentile */}
        <div className="border border-zinc-200 bg-white rounded-lg p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Anomaly</span>
          <div className="text-2xl font-mono font-extrabold text-zinc-950">
            {assessment?.anomalyPercentile ?? 0}<span className="text-xs font-normal text-zinc-400">th percentile</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Score: <span className="font-bold text-zinc-900">{assessment?.anomalyScore ?? 0.0}</span>
          </div>
        </div>

        {/* 3. Rolling Window */}
        <div className="border border-zinc-200 bg-white rounded-lg p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Window</span>
          <div className="text-2xl font-mono font-bold text-zinc-950">
            10 <span className="text-xs font-normal text-zinc-400 font-sans">minutes</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Events evaluated: <span className="font-bold text-zinc-900">{eventsList.length}</span>
          </div>
        </div>

        {/* 4. Target Actor Shortened */}
        <div className="border border-zinc-200 bg-white rounded-lg p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">Evaluated Actor</span>
          <div className="text-sm font-mono font-bold text-zinc-950 truncate mt-1.5">
            {shortenAddress(selectedActor)}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 truncate">
            {selectedActor}
          </div>
        </div>

      </div>

      {/* Main 3-Column Security Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. 10-MINUTE ACTIVITY FEATURES */}
        <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <span className="font-mono text-[11px] font-bold text-zinc-700 tracking-wider">10-MINUTE ACTIVITY</span>
            <span className="text-[11px] font-mono text-zinc-500">Feature Vector</span>
          </div>

          <div className="divide-y divide-zinc-100 text-xs font-mono">
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">Total Actions:</span>
              <span className="font-bold text-zinc-950">{features.totalActions ?? 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">NFT Mints:</span>
              <span className="font-bold text-zinc-950">{features.nftMints ?? 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">Transfers:</span>
              <span className="font-bold text-zinc-950">{features.completedTransfers ?? 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">Role Changes:</span>
              <span className="font-bold text-zinc-950">{features.roleChanges ?? 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">Unique Recipients:</span>
              <span className="font-bold text-zinc-950">{features.uniqueRecipients ?? 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">Recent Identities:</span>
              <span className="font-bold text-zinc-950">{features.recentIdentityInteractions ?? 0}</span>
            </div>
          </div>
        </div>

        {/* 2. TRIGGERED RULES */}
        <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <span className="font-mono text-[11px] font-bold text-zinc-700 tracking-wider">TRIGGERED RULES</span>
            <span className="text-[11px] font-mono text-zinc-500">{triggeredRules.length} Triggered</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {assessment?.ruleDetails?.map((rule: any) => (
              <div
                key={rule.id}
                className={`p-3 rounded-md border transition-colors ${
                  rule.triggered
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-zinc-50/50 border-zinc-200 text-zinc-600 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    {rule.triggered ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                    <span>{rule.id}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    rule.triggered ? 'bg-rose-200 text-rose-900' : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {rule.triggered ? 'TRIGGERED' : 'PASS'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 font-sans mt-0.5 leading-snug">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. LARGEST DEVIATIONS (Isolation Forest) */}
        <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <span className="font-mono text-[11px] font-bold text-zinc-700 tracking-wider">LARGEST DEVIATIONS</span>
            <span className="text-[10px] text-zinc-400 font-mono">Prototype ML Signal</span>
          </div>

          {largestDeviations.length === 0 ? (
            <p className="text-xs text-zinc-400 font-mono py-4 text-center">
              No significant deviations observed from normal baseline.
            </p>
          ) : (
            <div className="space-y-2.5">
              {largestDeviations.map((d: any) => (
                <div key={d.feature} className="p-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-950 font-sans">{d.label}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-bold">
                      {d.multiplier}× deviation
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 flex items-center justify-between">
                    <span>Observed: <strong className="text-zinc-950">{d.value}</strong></span>
                    <span className="text-zinc-500">Baseline: {d.baseline}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ACTIVITY TIMELINE */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-bold text-zinc-950 font-sans">Activity Timeline</h2>
          </div>
          <span className="text-xs font-mono text-zinc-500">{eventsList.length} Chronological EVM Events</span>
        </div>

        {eventsList.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 font-mono">
            No events recorded in the 10-minute window for this actor. Trigger demo activity above.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 font-mono text-xs">
            {eventsList.map((evt: any) => {
              const date = new Date(evt.timestamp * 1000);
              const timeStr = date.toTimeString().split(' ')[0];

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventModal(evt)}
                  className="py-2.5 px-2 hover:bg-zinc-50 rounded-md flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-[11px]">{timeStr}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evt.type === 'NFT_MINT'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : evt.type === 'ROLE_GRANTED' || evt.type === 'ROLE_REVOKED'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : evt.type === 'IDENTITY_ENROLLED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {evt.type}
                    </span>
                    <span className="text-zinc-700 text-xs truncate max-w-[240px]">
                      Tx: {shortenHash(evt.transactionHash)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-950 text-[11px]">
                    <span>Block #{evt.blockNumber}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AUTHORIZATION BOUNDARY SECTION */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-bold text-zinc-950 font-sans uppercase tracking-wider">Authorization Guarantee</h2>
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
            ENFORCED ON-CHAIN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="p-3.5 rounded-md bg-emerald-50/60 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 font-bold font-sans text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Smart Contracts: AUTHORITATIVE</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-sans leading-relaxed">
                All roles, asset mints, and transfers are exclusively enforced by Solidity smart contracts on the EVM.
              </p>
            </div>

            <div className="p-3.5 rounded-md bg-indigo-50/60 border border-indigo-200 space-y-1">
              <div className="flex items-center gap-2 text-indigo-900 font-bold font-sans text-xs">
                <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>AI / ML Risk: ADVISORY ONLY</span>
              </div>
              <p className="text-[11px] text-indigo-700 font-sans leading-relaxed">
                Risk scores and Isolation Forest percentiles are non-authoritative monitoring signals for auditor review.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-md bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
              AI NON-AUTHORITATIVE CONSTRAINTS
            </span>
            <ul className="space-y-1 text-zinc-600 font-sans text-xs">
              <li className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>AI cannot grant roles</span>
              </li>
              <li className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>AI cannot revoke roles</span>
              </li>
              <li className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>AI cannot mint assets</span>
              </li>
              <li className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>AI cannot transfer assets</span>
              </li>
              <li className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>AI cannot lock identities</span>
              </li>
              <li className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>AI cannot approve blockchain transactions</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-2 text-[11px] font-mono text-zinc-400 text-center border-t border-zinc-100">
          Synthetic data — not real-world fraud detection accuracy.
        </div>
      </div>

      {/* CLICKED EVENT EVIDENCE MODAL */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
          <div className="border border-zinc-200 bg-white rounded-lg p-6 max-w-xl w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-950 font-sans">Blockchain Event Evidence</h3>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="text-zinc-400 hover:text-zinc-600 text-xs font-mono font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">TRANSACTION HASH</span>
                <span className="text-zinc-900 break-all select-all bg-zinc-50 p-1.5 rounded border border-zinc-200 block mt-0.5">
                  {selectedEventModal.transactionHash}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-bold">EVENT TYPE</span>
                  <span className="font-bold text-zinc-900">{selectedEventModal.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-bold">BLOCK NUMBER</span>
                  <span className="text-zinc-800">#{selectedEventModal.blockNumber}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">ACTOR / CONTROLLER</span>
                <span className="text-zinc-800 break-all select-all">{selectedEventModal.actor}</span>
              </div>

              {selectedEventModal.target && (
                <div>
                  <span className="text-[10px] text-zinc-400 block font-bold">TARGET / RECIPIENT</span>
                  <span className="text-zinc-800 break-all select-all">{selectedEventModal.target}</span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">RAW EVENT PAYLOAD</span>
                <pre className="bg-zinc-950 text-zinc-100 p-3 rounded-md text-[11px] overflow-x-auto mt-1">
                  {JSON.stringify(selectedEventModal.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-2 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-2xs"
              >
                Close Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
