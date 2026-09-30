import db, { ActivityEventRow } from '../db';
import crypto from 'crypto';

export interface RawEVMEvent {
  contractAddress: string;
  contractName: string;
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  args: Record<string, any>;
  actor: string;
}

export type NormalizedEventType =
  | 'ROLE_GRANTED'
  | 'ROLE_REVOKED'
  | 'NFT_MINT'
  | 'TRANSFER_REQUEST'
  | 'TRANSFER_COMPLETED'
  | 'IDENTITY_ENROLLED';

export interface NormalizedActivityEvent {
  id: string;
  actor: string;
  controller: string;
  type: NormalizedEventType;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  target?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

class EventCollector {
  /**
   * Ingest an EVM event, normalize it, and save to SQLite.
   */
  public processEvent(raw: RawEVMEvent): NormalizedActivityEvent {
    let type: NormalizedEventType;
    let target: string | undefined = undefined;
    const metadata: Record<string, any> = { ...raw.args };

    switch (raw.eventName) {
      case 'IdentityEnrolled':
        type = 'IDENTITY_ENROLLED';
        target = raw.args.controller;
        metadata.did = raw.args.did;
        break;

      case 'RoleGranted':
        type = 'ROLE_GRANTED';
        target = raw.args.account;
        metadata.role = raw.args.role;
        metadata.roleName = raw.args.roleName;
        break;

      case 'RoleRevoked':
        type = 'ROLE_REVOKED';
        target = raw.args.account;
        metadata.role = raw.args.role;
        metadata.roleName = raw.args.roleName;
        break;

      case 'NFTMinted':
        type = 'NFT_MINT';
        target = raw.args.recipient;
        metadata.tokenId = raw.args.tokenId;
        metadata.tokenName = raw.args.tokenName;
        break;

      case 'TransferRequested':
        type = 'TRANSFER_REQUEST';
        target = raw.args.to;
        metadata.tokenId = raw.args.tokenId;
        metadata.from = raw.args.from;
        break;

      case 'TransferCompleted':
        type = 'TRANSFER_COMPLETED';
        target = raw.args.to;
        metadata.tokenId = raw.args.tokenId;
        metadata.from = raw.args.from;
        break;

      default:
        type = 'NFT_MINT';
        break;
    }

    const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const controller = raw.actor;

    const normalized: NormalizedActivityEvent = {
      id: eventId,
      actor: raw.actor,
      controller: controller,
      type,
      transactionHash: raw.transactionHash,
      blockNumber: raw.blockNumber,
      timestamp: raw.timestamp,
      target,
      metadata,
      createdAt: new Date(raw.timestamp * 1000).toISOString(),
    };

    // Store in database
    const insertStmt = db.prepare(`
      INSERT INTO activity_events (
        id, actor, controller, event_type, transaction_hash, block_number, timestamp, target, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      normalized.id,
      normalized.actor,
      normalized.controller,
      normalized.type,
      normalized.transactionHash,
      normalized.blockNumber,
      normalized.timestamp,
      normalized.target || null,
      JSON.stringify(normalized.metadata),
      normalized.createdAt
    );

    return normalized;
  }

  /**
   * Get recent normalized events
   */
  public getEvents(options?: { actor?: string; limit?: number; since?: number }): NormalizedActivityEvent[] {
    let query = 'SELECT * FROM activity_events';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.actor) {
      conditions.push('actor = ?');
      params.push(options.actor);
    }

    if (options?.since) {
      conditions.push('timestamp >= ?');
      params.push(options.since);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY timestamp DESC, block_number DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    } else {
      query += ' LIMIT 100';
    }

    const rows = db.prepare(query).all(...params) as ActivityEventRow[];

    return rows.map((row) => ({
      id: row.id,
      actor: row.actor,
      controller: row.controller,
      type: row.event_type as NormalizedEventType,
      transactionHash: row.transaction_hash,
      blockNumber: row.block_number,
      timestamp: row.timestamp,
      target: row.target || undefined,
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
      createdAt: row.created_at,
    }));
  }

  /**
   * Clear all activity events (used by demo reset)
   */
  public clearAllEvents() {
    db.prepare('DELETE FROM activity_events').run();
    db.prepare('DELETE FROM risk_assessments').run();
  }
}

export const eventCollector = new EventCollector();
