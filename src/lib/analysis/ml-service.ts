import { ActivityFeatures } from './activity-aggregator';

export interface DeviationItem {
  feature: string;
  label: string;
  value: number;
  baseline: number;
  multiplier: number;
}

export interface IsolationForestResult {
  anomalyScore: number;
  anomalyPercentile: number;
  largestDeviations: DeviationItem[];
  modelLabel: string;
  isSynthetic: boolean;
}

export interface AdvisoryRiskAssessment {
  actor: string;
  windowStart: number;
  windowEnd: number;
  riskScore: number;
  anomalyPercentile: number;
  anomalyScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggeredRules: string[];
  ruleDetails: Array<{ id: string; name: string; description: string; triggered: boolean }>;
  largestDeviations: DeviationItem[];
  features: ActivityFeatures;
  authorizationStatus: {
    smartContractControlled: boolean;
    aiAuthorizationPermitted: boolean;
    disclaimer: string;
  };
}

// -------------------------------------------------------------
// 1. Transparent Rule Engine
// -------------------------------------------------------------
export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  thresholdDescription: string;
  evaluate: (f: ActivityFeatures) => boolean;
  weight: number;
}

export class RuleEngine {
  private rules: RuleDefinition[] = [
    {
      id: 'HIGH_ACTION_VOLUME',
      name: 'High Action Volume',
      description: 'Actor executed more than 15 blockchain transactions in the 10-minute window.',
      thresholdDescription: 'totalActions > 15',
      evaluate: (f) => f.totalActions > 15,
      weight: 25,
    },
    {
      id: 'MULTIPLE_NFT_MINTS',
      name: 'Multiple NFT Mints',
      description: 'Actor minted more than 5 verifiable asset tokens in 10 minutes.',
      thresholdDescription: 'nftMints > 5',
      evaluate: (f) => f.nftMints > 5,
      weight: 25,
    },
    {
      id: 'MULTIPLE_ROLE_CHANGES',
      name: 'Rapid Role Changes',
      description: 'More than 2 role grant/revoke operations performed in 10 minutes.',
      thresholdDescription: 'roleChanges > 2',
      evaluate: (f) => f.roleChanges > 2,
      weight: 20,
    },
    {
      id: 'MULTIPLE_RECIPIENTS',
      name: 'High Fan-out Recipients',
      description: 'Transfers or mints directed to more than 5 distinct recipient addresses.',
      thresholdDescription: 'uniqueRecipients > 5',
      evaluate: (f) => f.uniqueRecipients > 5,
      weight: 20,
    },
    {
      id: 'RECENT_IDENTITY_INTERACTIONS',
      name: 'Recent Identity Interactions',
      description: 'Interactions involving identities enrolled within the last hour exceed 2.',
      thresholdDescription: 'recentIdentityInteractions > 2',
      evaluate: (f) => f.recentIdentityInteractions > 2,
      weight: 15,
    },
    {
      id: 'RAPID_TRANSFERS',
      name: 'Rapid Asset Transfers',
      description: 'More than 4 completed transfers executed within the 10-minute window.',
      thresholdDescription: 'completedTransfers > 4',
      evaluate: (f) => f.completedTransfers > 4,
      weight: 15,
    },
  ];

  public evaluate(features: ActivityFeatures): { triggeredRules: string[]; ruleDetails: Array<{ id: string; name: string; description: string; triggered: boolean }> } {
    const triggeredRules: string[] = [];
    const ruleDetails = this.rules.map((rule) => {
      const triggered = rule.evaluate(features);
      if (triggered) {
        triggeredRules.push(rule.id);
      }
      return {
        id: rule.id,
        name: rule.name,
        description: `${rule.description} (${rule.thresholdDescription})`,
        triggered,
      };
    });

    return { triggeredRules, ruleDetails };
  }

  public getRuleWeight(ruleId: string): number {
    const found = this.rules.find((r) => r.id === ruleId);
    return found ? found.weight : 10;
  }
}

// -------------------------------------------------------------
// 2. Isolation Forest Adapter (Deterministic Synthetic/Mock)
// -------------------------------------------------------------
export interface IIsolationForestAnalyzer {
  analyze(features: ActivityFeatures): IsolationForestResult;
}

export class IsolationForestAdapter implements IIsolationForestAnalyzer {
  private baselines: Record<string, { label: string; baseline: number }> = {
    totalActions: { label: 'Total Actions', baseline: 3.2 },
    nftMints: { label: 'NFT Mints', baseline: 1.4 },
    roleChanges: { label: 'Role Changes', baseline: 0.2 },
    completedTransfers: { label: 'Transfers Completed', baseline: 1.1 },
    uniqueRecipients: { label: 'Unique Recipients', baseline: 2.1 },
    recentIdentityInteractions: { label: 'Recent Identities', baseline: 0.3 },
  };

  public analyze(features: ActivityFeatures): IsolationForestResult {
    const deviations: DeviationItem[] = [];

    for (const [key, meta] of Object.entries(this.baselines)) {
      const val = (features as any)[key] || 0;
      const mult = val > 0 ? parseFloat((val / meta.baseline).toFixed(1)) : 0;
      if (val > meta.baseline) {
        deviations.push({
          feature: key,
          label: meta.label,
          value: val,
          baseline: meta.baseline,
          multiplier: mult,
        });
      }
    }

    // Sort by multiplier descending
    deviations.sort((a, b) => b.multiplier - a.multiplier);

    // Compute synthetic anomaly score based on activity intensity
    let anomalyScore = 0.08;
    let anomalyPercentile = 12;

    if (features.totalActions === 0) {
      anomalyScore = 0.02;
      anomalyPercentile = 4;
    } else if (features.totalActions <= 3 && features.roleChanges === 0) {
      anomalyScore = 0.14;
      anomalyPercentile = 18;
    } else if (features.totalActions > 15 || features.nftMints > 5 || features.roleChanges >= 3) {
      anomalyScore = 0.81 + Math.min(0.18, (features.totalActions - 15) * 0.01);
      anomalyPercentile = Math.min(99, 94 + Math.floor(features.totalActions / 4));
    } else if (features.totalActions > 7 || features.nftMints > 2) {
      anomalyScore = 0.52;
      anomalyPercentile = 68;
    }

    return {
      anomalyScore: parseFloat(anomalyScore.toFixed(2)),
      anomalyPercentile,
      largestDeviations: deviations.slice(0, 4),
      modelLabel: 'Isolation Forest (Prototype / Synthetic ML Signal)',
      isSynthetic: true,
    };
  }
}

// -------------------------------------------------------------
// 3. Advisory Risk Analysis Service
// -------------------------------------------------------------
export class MLAnalysisService {
  private ruleEngine: RuleEngine;
  private ifAnalyzer: IIsolationForestAnalyzer;

  constructor() {
    this.ruleEngine = new RuleEngine();
    this.ifAnalyzer = new IsolationForestAdapter();
  }

  public assessActorRisk(features: ActivityFeatures): AdvisoryRiskAssessment {
    const { triggeredRules, ruleDetails } = this.ruleEngine.evaluate(features);
    const ifResult = this.ifAnalyzer.analyze(features);

    // Weighted Risk Score Calculation (0 - 100)
    let rawScore = 0;
    for (const ruleId of triggeredRules) {
      rawScore += this.ruleEngine.getRuleWeight(ruleId);
    }

    // Blend with anomaly score
    const combinedScore = Math.min(
      100,
      Math.round(rawScore * 0.6 + ifResult.anomalyScore * 100 * 0.4)
    );

    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (combinedScore >= 75) {
      severity = 'HIGH';
    } else if (combinedScore >= 45) {
      severity = 'MEDIUM';
    }

    if (combinedScore >= 90 && triggeredRules.length >= 3) {
      severity = 'CRITICAL';
    }

    return {
      actor: features.actor,
      windowStart: features.windowStart,
      windowEnd: features.windowEnd,
      riskScore: combinedScore,
      anomalyPercentile: ifResult.anomalyPercentile,
      anomalyScore: ifResult.anomalyScore,
      severity,
      triggeredRules,
      ruleDetails,
      largestDeviations: ifResult.largestDeviations,
      features,
      authorizationStatus: {
        smartContractControlled: true,
        aiAuthorizationPermitted: false,
        disclaimer:
          'ADVISORY ONLY: AI and risk scoring systems are non-authoritative. All permissions, asset mints, and transfers are exclusively enforced by smart contracts on-chain.',
      },
    };
  }
}

export const mlAnalysisService = new MLAnalysisService();
