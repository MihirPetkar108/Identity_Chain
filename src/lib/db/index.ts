import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'identity_chain.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dids (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    did_identifier TEXT UNIQUE NOT NULL,
    controller_address TEXT NOT NULL,
    controller_private_key TEXT,
    status TEXT DEFAULT 'VERIFIED',
    verification_method TEXT DEFAULT 'did:key:secp256k1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS deployed_contracts (
    name TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deployer_address TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_events (
    id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    controller TEXT NOT NULL,
    event_type TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    target TEXT,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_events(actor);
  CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_events(event_type);

  CREATE TABLE IF NOT EXISTS nfts (
    id TEXT PRIMARY KEY,
    token_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    owner_address TEXT NOT NULL,
    minter_address TEXT NOT NULL,
    token_uri TEXT,
    tx_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    window_end INTEGER NOT NULL,
    risk_score INTEGER NOT NULL,
    anomaly_score REAL NOT NULL,
    anomaly_percentile INTEGER NOT NULL,
    severity TEXT NOT NULL,
    triggered_rules_json TEXT NOT NULL,
    largest_deviations_json TEXT NOT NULL,
    features_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_risk_actor ON risk_assessments(actor);
`);

export default db;

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface DIDRow {
  id: string;
  user_id: string;
  did_identifier: string;
  controller_address: string;
  controller_private_key?: string;
  status: string;
  verification_method: string;
  created_at: string;
}

export interface ActivityEventRow {
  id: string;
  actor: string;
  controller: string;
  event_type: string;
  transaction_hash: string;
  block_number: number;
  timestamp: number;
  target?: string;
  metadata_json: string;
  created_at: string;
}

export interface NFTRow {
  id: string;
  token_id: number;
  name: string;
  description: string;
  owner_address: string;
  minter_address: string;
  token_uri: string;
  tx_hash: string;
  created_at: string;
}

export interface RiskAssessmentRow {
  id: string;
  actor: string;
  window_start: number;
  window_end: number;
  risk_score: number;
  anomaly_score: number;
  anomaly_percentile: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggered_rules_json: string;
  largest_deviations_json: string;
  features_json: string;
  created_at: string;
}
