import { ethers } from 'ethers';
import db, { DIDRow } from '../db';
import { localEVM } from '../blockchain/evm';
import crypto from 'crypto';

export interface DIDProfile {
  id: string;
  userId: string;
  did: string;
  controller: string;
  status: 'VERIFIED' | 'PENDING' | 'REVOKED';
  verificationMethod: string;
  enrolledOnChain: boolean;
  createdAt: string;
}

export class DIDService {
  /**
   * Retrieves or creates a DID profile for an authenticated application user.
   */
  public async getOrCreateDID(userId: string): Promise<DIDProfile> {
    let row = db.prepare('SELECT * FROM dids WHERE user_id = ?').get(userId) as DIDRow | undefined;

    if (!row) {
      // Generate a deterministic wallet controller for this user
      const randomWallet = ethers.Wallet.createRandom();
      const didId = `did_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const didIdentifier = `did:ethr:${randomWallet.address}`;
      const verificationMethod = 'did:key:secp256k1#controller';

      db.prepare(`
        INSERT INTO dids (id, user_id, did_identifier, controller_address, controller_private_key, status, verification_method)
        VALUES (?, ?, ?, ?, ?, 'VERIFIED', ?)
      `).run(
        didId,
        userId,
        didIdentifier,
        randomWallet.address,
        randomWallet.privateKey,
        verificationMethod
      );

      // Enroll on the smart contract IdentityRegistry
      try {
        await localEVM.enrollIdentity(randomWallet.address, didIdentifier, randomWallet.address);
      } catch (err) {
        console.warn('Smart contract enrollment warning:', err);
      }

      row = db.prepare('SELECT * FROM dids WHERE id = ?').get(didId) as DIDRow;
    }

    const enrolledOnChain = localEVM.isEnrolled(row.controller_address);

    return {
      id: row.id,
      userId: row.user_id,
      did: row.did_identifier,
      controller: row.controller_address,
      status: (row.status as any) || 'VERIFIED',
      verificationMethod: row.verification_method,
      enrolledOnChain,
      createdAt: row.created_at,
    };
  }

  public getDIDByUserId(userId: string): DIDProfile | null {
    const row = db.prepare('SELECT * FROM dids WHERE user_id = ?').get(userId) as DIDRow | undefined;
    if (!row) return null;

    const enrolledOnChain = localEVM.isEnrolled(row.controller_address);

    return {
      id: row.id,
      userId: row.user_id,
      did: row.did_identifier,
      controller: row.controller_address,
      status: (row.status as any) || 'VERIFIED',
      verificationMethod: row.verification_method,
      enrolledOnChain,
      createdAt: row.created_at,
    };
  }

  public getControllerSigner(userId: string): ethers.Wallet | null {
    const row = db.prepare('SELECT * FROM dids WHERE user_id = ?').get(userId) as DIDRow | undefined;
    if (!row || !row.controller_private_key) return null;
    return new ethers.Wallet(row.controller_private_key);
  }
}

export const didService = new DIDService();
