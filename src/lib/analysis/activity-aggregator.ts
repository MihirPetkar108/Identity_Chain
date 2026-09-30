import db, { ActivityEventRow } from '../db';
import { localEVM } from '../blockchain/evm';

export interface ActivityFeatures {
  actor: string;
  window: string;
  windowStart: number;
  windowEnd: number;
  totalActions: number;
  roleChanges: number;
  nftMints: number;
  transferRequests: number;
  completedTransfers: number;
  uniqueRecipients: number;
  recentIdentityInteractions: number;
  eventsList: Array<{
    id: string;
    type: string;
    target?: string;
    timestamp: number;
    transactionHash: string;
    blockNumber: number;
    metadata: Record<string, any>;
  }>;
}

export class ActivityAggregator {
  private windowDurationSeconds: number = 10 * 60; // 10 minutes

  /**
   * Calculates the rolling 10-minute activity features for a specific actor or overall.
   */
  public getFeaturesForActor(actorAddress: string, referenceTimestamp?: number): ActivityFeatures {
    const now = referenceTimestamp || Math.floor(Date.now() / 1000);
    const windowStart = now - this.windowDurationSeconds;

    const rows = db.prepare(`
      SELECT * FROM activity_events 
      WHERE (LOWER(actor) = LOWER(?) OR LOWER(controller) = LOWER(?))
        AND timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
    `).all(actorAddress, actorAddress, windowStart, now) as ActivityEventRow[];

    let roleChanges = 0;
    let nftMints = 0;
    let transferRequests = 0;
    let completedTransfers = 0;
    const recipientSet = new Set<string>();
    let recentIdentityInteractions = 0;

    const oneHourAgo = now - 3600;

    const eventsList = rows.map((r) => {
      const meta = r.metadata_json ? JSON.parse(r.metadata_json) : {};
      
      if (r.event_type === 'ROLE_GRANTED' || r.event_type === 'ROLE_REVOKED') {
        roleChanges++;
      } else if (r.event_type === 'NFT_MINT') {
        nftMints++;
      } else if (r.event_type === 'TRANSFER_REQUEST') {
        transferRequests++;
      } else if (r.event_type === 'TRANSFER_COMPLETED') {
        completedTransfers++;
      }

      if (r.target) {
        recipientSet.add(r.target.toLowerCase());
        
        // Check if target is a recently enrolled identity
        const enrollmentTime = localEVM.getEnrollmentTimestamp(r.target);
        if (enrollmentTime > 0 && enrollmentTime >= oneHourAgo) {
          recentIdentityInteractions++;
        }
      }

      return {
        id: r.id,
        type: r.event_type,
        target: r.target || undefined,
        timestamp: r.timestamp,
        transactionHash: r.transaction_hash,
        blockNumber: r.block_number,
        metadata: meta,
      };
    });

    const totalActions = rows.length;
    const uniqueRecipients = recipientSet.size;

    return {
      actor: actorAddress,
      window: '10m',
      windowStart,
      windowEnd: now,
      totalActions,
      roleChanges,
      nftMints,
      transferRequests,
      completedTransfers,
      uniqueRecipients,
      recentIdentityInteractions,
      eventsList,
    };
  }

  /**
   * Get all active actors seen in the system
   */
  public getAllActors(): string[] {
    const rows = db.prepare(`
      SELECT DISTINCT actor FROM activity_events
      ORDER BY timestamp DESC
    `).all() as { actor: string }[];

    const actors = rows.map((r) => r.actor);
    return actors;
  }
}

export const activityAggregator = new ActivityAggregator();
