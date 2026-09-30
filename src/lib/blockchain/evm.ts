import { ethers } from 'ethers';
import db from '../db';
import { eventCollector } from './collector';
import artifacts from './artifacts.json';

export interface DeployedContractInfo {
  name: string;
  address: string;
  deployedAt: string;
  deployerAddress: string;
  abi: any[];
}

export interface EVMTransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  from: string;
  to: string;
  status: 1 | 0;
  events: Array<{
    eventName: string;
    args: Record<string, any>;
  }>;
}

// In-Memory Contract State Engine (Simulated EVM Execution Engine)
class LocalEVM {
  private blockNumber: number = 1000;
  private deployer: ethers.Wallet;
  private initialized: boolean = false;

  // Contracts
  public identityRegistryAddress: string = '';
  public roleManagerAddress: string = '';
  public assetNFTAddress: string = '';

  // Internal EVM State
  private identities: Map<string, { did: string; controller: string; enrolledAt: number; active: boolean }> = new Map();
  private didToController: Map<string, string> = new Map();
  private roles: Map<string, Set<string>> = new Map(); // roleHash -> Set of account addresses
  private nfts: Map<number, { id: number; name: string; description: string; uri: string; minter: string; owner: string; mintedAt: number }> = new Map();
  private nextTokenId: number = 1;

  constructor() {
    // Standard dev wallet
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    this.deployer = new ethers.Wallet(privateKey);
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.initialized) return;

    // Deterministic contract addresses based on deployer nonce
    this.identityRegistryAddress = ethers.getCreateAddress({ from: this.deployer.address, nonce: 0 });
    this.roleManagerAddress = ethers.getCreateAddress({ from: this.deployer.address, nonce: 1 });
    this.assetNFTAddress = ethers.getCreateAddress({ from: this.deployer.address, nonce: 2 });

    // Store in DB
    const insertContract = db.prepare(`
      INSERT OR REPLACE INTO deployed_contracts (name, address, deployed_at, deployer_address)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?)
    `);

    insertContract.run('IdentityRegistry', this.identityRegistryAddress, this.deployer.address);
    insertContract.run('RoleManager', this.roleManagerAddress, this.deployer.address);
    insertContract.run('AssetNFT', this.assetNFTAddress, this.deployer.address);

    // Initial roles for deployer
    const adminRole = ethers.ZeroHash;
    const minterRole = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
    const auditorRole = ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_ROLE'));

    this.roles.set(adminRole, new Set([this.deployer.address.toLowerCase()]));
    this.roles.set(minterRole, new Set([this.deployer.address.toLowerCase()]));
    this.roles.set(auditorRole, new Set([this.deployer.address.toLowerCase()]));

    // Restore enrolled DIDs and identities from DB
    try {
      const didRows = db.prepare('SELECT * FROM dids').all() as any[];
      for (const row of didRows) {
        if (row.controller_address && row.did_identifier) {
          const ctrl = row.controller_address.toLowerCase();
          const timestamp = row.created_at ? Math.floor(new Date(row.created_at).getTime() / 1000) : 1000;
          this.identities.set(ctrl, {
            did: row.did_identifier,
            controller: row.controller_address,
            enrolledAt: timestamp,
            active: true,
          });
          this.didToController.set(row.did_identifier, ctrl);
        }
      }

      // Restore enrolled identities from activity_events
      const enrolledEvents = db.prepare("SELECT * FROM activity_events WHERE event_type = 'IDENTITY_ENROLLED'").all() as any[];
      for (const evt of enrolledEvents) {
        const meta = evt.metadata_json ? JSON.parse(evt.metadata_json) : {};
        const ctrl = (evt.target || evt.controller || '').toLowerCase();
        const did = meta.did || `did:ethr:${ctrl}`;
        if (ctrl) {
          this.identities.set(ctrl, {
            did,
            controller: evt.target || evt.controller,
            enrolledAt: evt.timestamp || 1000,
            active: true,
          });
          this.didToController.set(did, ctrl);
        }
      }

      // Restore roles from activity_events
      const roleEvents = db.prepare("SELECT * FROM activity_events WHERE event_type IN ('ROLE_GRANTED', 'ROLE_REVOKED') ORDER BY timestamp ASC, id ASC").all() as any[];
      for (const evt of roleEvents) {
        const meta = evt.metadata_json ? JSON.parse(evt.metadata_json) : {};
        const roleHash = meta.role || (meta.roleName === 'ADMIN' ? ethers.ZeroHash : ethers.keccak256(ethers.toUtf8Bytes(`${meta.roleName}_ROLE`)));
        const account = (evt.target || '').toLowerCase();
        if (account && roleHash) {
          if (!this.roles.has(roleHash)) {
            this.roles.set(roleHash, new Set());
          }
          if (evt.event_type === 'ROLE_GRANTED') {
            this.roles.get(roleHash)!.add(account);
          } else {
            this.roles.get(roleHash)!.delete(account);
          }
        }
      }

      // Restore NFTs from DB
      const nftRows = db.prepare('SELECT * FROM nfts').all() as any[];
      for (const n of nftRows) {
        this.nfts.set(n.token_id, {
          id: n.token_id,
          name: n.name,
          description: n.description,
          uri: n.token_uri,
          minter: n.minter_address,
          owner: n.owner_address,
          mintedAt: n.created_at ? Math.floor(new Date(n.created_at).getTime() / 1000) : 1000,
        });
      }

      const maxRow = db.prepare('SELECT MAX(token_id) as maxId FROM nfts').get() as any;
      if (maxRow && maxRow.maxId) {
        this.nextTokenId = maxRow.maxId + 1;
      }
    } catch (e) {
      console.warn('Error restoring EVM state from DB:', e);
    }

    this.initialized = true;
  }

  public getDeployer(): ethers.Wallet {
    return this.deployer;
  }

  public getContracts(): Record<string, DeployedContractInfo> {
    this.ensureInitialized();
    return {
      IdentityRegistry: {
        name: 'IdentityRegistry',
        address: this.identityRegistryAddress,
        deployedAt: 'Genesis',
        deployerAddress: this.deployer.address,
        abi: (artifacts as any).IdentityRegistry?.abi || [],
      },
      RoleManager: {
        name: 'RoleManager',
        address: this.roleManagerAddress,
        deployedAt: 'Genesis',
        deployerAddress: this.deployer.address,
        abi: (artifacts as any).RoleManager?.abi || [],
      },
      AssetNFT: {
        name: 'AssetNFT',
        address: this.assetNFTAddress,
        deployedAt: 'Genesis',
        deployerAddress: this.deployer.address,
        abi: (artifacts as any).AssetNFT?.abi || [],
      },
    };
  }

  public getNetworkStatus() {
    this.ensureInitialized();
    const eventCount = (db.prepare('SELECT COUNT(*) as cnt FROM activity_events').get() as any)?.cnt || 0;
    return {
      network: 'Local EVM (Deterministic Simulated)',
      chainId: 31337,
      blockNumber: this.blockNumber,
      deployer: this.deployer.address,
      contractsDeployed: 3,
      totalEventsMined: eventCount,
      identityRegistryAddress: this.identityRegistryAddress,
      roleManagerAddress: this.roleManagerAddress,
      assetNFTAddress: this.assetNFTAddress,
    };
  }

  /**
   * Mine a simulated transaction block
   */
  private mineBlock(): { blockNumber: number; timestamp: number } {
    this.blockNumber += 1;
    return {
      blockNumber: this.blockNumber,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  // -------------------------------------------------------------
  // Smart Contract 1: IdentityRegistry Execution
  // -------------------------------------------------------------

  /**
   * Executes IdentityRegistry.enrollIdentity(did, controller)
   */
  public async enrollIdentity(
    callerAddress: string,
    did: string,
    controllerAddress: string
  ): Promise<EVMTransactionReceipt> {
    this.ensureInitialized();
    const caller = callerAddress.toLowerCase();
    const controller = controllerAddress.toLowerCase();

    if (!did || !controllerAddress) {
      throw new Error('IdentityRegistry: invalid DID or controller address');
    }

    const existingController = this.didToController.get(did);
    if (existingController && existingController !== controller) {
      throw new Error('IdentityRegistry: DID already bound to another controller');
    }

    const { blockNumber, timestamp } = this.mineBlock();
    const txHash = ethers.keccak256(
      ethers.toUtf8Bytes(`enrollIdentity_${did}_${controller}_${blockNumber}_${timestamp}_${Math.random()}`)
    );

    this.identities.set(controller, {
      did,
      controller: controllerAddress,
      enrolledAt: timestamp,
      active: true,
    });
    this.didToController.set(did, controller);

    // Trigger EVM Event
    const rawEvent = {
      contractAddress: this.identityRegistryAddress,
      contractName: 'IdentityRegistry',
      eventName: 'IdentityEnrolled',
      transactionHash: txHash,
      blockNumber,
      timestamp,
      actor: callerAddress,
      args: {
        did,
        controller: controllerAddress,
        timestamp,
      },
    };

    eventCollector.processEvent(rawEvent);

    return {
      transactionHash: txHash,
      blockNumber,
      from: callerAddress,
      to: this.identityRegistryAddress,
      status: 1,
      events: [{ eventName: 'IdentityEnrolled', args: rawEvent.args }],
    };
  }

  public isEnrolled(controllerAddress: string): boolean {
    this.ensureInitialized();
    const ctrl = controllerAddress.toLowerCase();
    const id = this.identities.get(ctrl);
    if (id && id.active) return true;

    try {
      const didRow = db.prepare('SELECT * FROM dids WHERE LOWER(controller_address) = ?').get(ctrl) as any;
      if (didRow) {
        this.identities.set(ctrl, {
          did: didRow.did_identifier,
          controller: didRow.controller_address,
          enrolledAt: Math.floor(new Date(didRow.created_at || Date.now()).getTime() / 1000),
          active: true,
        });
        return true;
      }

      const evt = db.prepare("SELECT * FROM activity_events WHERE event_type = 'IDENTITY_ENROLLED' AND (LOWER(target) = ? OR LOWER(controller) = ?)").get(ctrl, ctrl) as any;
      if (evt) {
        const meta = evt.metadata_json ? JSON.parse(evt.metadata_json) : {};
        this.identities.set(ctrl, {
          did: meta.did || `did:ethr:${ctrl}`,
          controller: evt.target || evt.controller,
          enrolledAt: evt.timestamp || 1000,
          active: true,
        });
        return true;
      }
    } catch {}

    return false;
  }

  public getEnrollmentTimestamp(controllerAddress: string): number {
    this.ensureInitialized();
    const ctrl = controllerAddress.toLowerCase();
    const id = this.identities.get(ctrl);
    if (id) return id.enrolledAt;

    try {
      const didRow = db.prepare('SELECT * FROM dids WHERE LOWER(controller_address) = ?').get(ctrl) as any;
      if (didRow) {
        const ts = Math.floor(new Date(didRow.created_at || Date.now()).getTime() / 1000);
        return ts;
      }
    } catch {}

    return 0;
  }

  public getIdentity(controllerAddress: string) {
    this.ensureInitialized();
    const ctrl = controllerAddress.toLowerCase();
    let id = this.identities.get(ctrl);
    if (!id) {
      this.isEnrolled(controllerAddress);
      id = this.identities.get(ctrl);
    }
    return id || null;
  }

  // -------------------------------------------------------------
  // Smart Contract 2: RoleManager Execution
  // -------------------------------------------------------------

  public hasRole(roleNameOrHash: string, accountAddress: string): boolean {
    const account = accountAddress.toLowerCase();
    const roleHash = roleNameOrHash.startsWith('0x')
      ? roleNameOrHash
      : roleNameOrHash === 'ADMIN'
      ? ethers.ZeroHash
      : ethers.keccak256(ethers.toUtf8Bytes(`${roleNameOrHash}_ROLE`));

    const roleSet = this.roles.get(roleHash);
    return !!(roleSet && roleSet.has(account));
  }

  /**
   * Executes RoleManager.grantRole(role, account)
   */
  public async grantRole(
    callerAddress: string,
    roleName: string,
    accountAddress: string
  ): Promise<EVMTransactionReceipt> {
    this.ensureInitialized();
    const caller = callerAddress.toLowerCase();
    const account = accountAddress.toLowerCase();

    // Authorization check: only admin can grant roles
    const adminRole = ethers.ZeroHash;
    const adminSet = this.roles.get(adminRole);
    const isAdmin = (adminSet && adminSet.has(caller)) || caller === this.deployer.address.toLowerCase();

    if (!isAdmin) {
      throw new Error('RoleManager: sender must have ADMIN role to grant roles');
    }

    const roleHash = roleName === 'ADMIN' ? ethers.ZeroHash : ethers.keccak256(ethers.toUtf8Bytes(`${roleName}_ROLE`));

    if (!this.roles.has(roleHash)) {
      this.roles.set(roleHash, new Set());
    }

    this.roles.get(roleHash)!.add(account);

    const { blockNumber, timestamp } = this.mineBlock();
    const txHash = ethers.keccak256(
      ethers.toUtf8Bytes(`grantRole_${roleName}_${account}_${blockNumber}_${timestamp}_${Math.random()}`)
    );

    const rawEvent = {
      contractAddress: this.roleManagerAddress,
      contractName: 'RoleManager',
      eventName: 'RoleGranted',
      transactionHash: txHash,
      blockNumber,
      timestamp,
      actor: callerAddress,
      args: {
        role: roleHash,
        roleName,
        account: accountAddress,
        sender: callerAddress,
      },
    };

    eventCollector.processEvent(rawEvent);

    return {
      transactionHash: txHash,
      blockNumber,
      from: callerAddress,
      to: this.roleManagerAddress,
      status: 1,
      events: [{ eventName: 'RoleGranted', args: rawEvent.args }],
    };
  }

  /**
   * Executes RoleManager.revokeRole(role, account)
   */
  public async revokeRole(
    callerAddress: string,
    roleName: string,
    accountAddress: string
  ): Promise<EVMTransactionReceipt> {
    this.ensureInitialized();
    const caller = callerAddress.toLowerCase();
    const account = accountAddress.toLowerCase();

    const adminRole = ethers.ZeroHash;
    const adminSet = this.roles.get(adminRole);
    const isAdmin = (adminSet && adminSet.has(caller)) || caller === this.deployer.address.toLowerCase();

    if (!isAdmin) {
      throw new Error('RoleManager: sender must have ADMIN role to revoke roles');
    }

    const roleHash = roleName === 'ADMIN' ? ethers.ZeroHash : ethers.keccak256(ethers.toUtf8Bytes(`${roleName}_ROLE`));

    if (this.roles.has(roleHash)) {
      this.roles.get(roleHash)!.delete(account);
    }

    const { blockNumber, timestamp } = this.mineBlock();
    const txHash = ethers.keccak256(
      ethers.toUtf8Bytes(`revokeRole_${roleName}_${account}_${blockNumber}_${timestamp}_${Math.random()}`)
    );

    const rawEvent = {
      contractAddress: this.roleManagerAddress,
      contractName: 'RoleManager',
      eventName: 'RoleRevoked',
      transactionHash: txHash,
      blockNumber,
      timestamp,
      actor: callerAddress,
      args: {
        role: roleHash,
        roleName,
        account: accountAddress,
        sender: callerAddress,
      },
    };

    eventCollector.processEvent(rawEvent);

    return {
      transactionHash: txHash,
      blockNumber,
      from: callerAddress,
      to: this.roleManagerAddress,
      status: 1,
      events: [{ eventName: 'RoleRevoked', args: rawEvent.args }],
    };
  }

  public getAccountRoles(accountAddress: string): string[] {
    const account = accountAddress.toLowerCase();
    const result: string[] = [];

    if (this.roles.get(ethers.ZeroHash)?.has(account)) result.push('ADMIN');
    if (this.roles.get(ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE')))?.has(account)) result.push('MINTER');
    if (this.roles.get(ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_ROLE')))?.has(account)) result.push('AUDITOR');
    if (this.roles.get(ethers.keccak256(ethers.toUtf8Bytes('OPERATOR_ROLE')))?.has(account)) result.push('OPERATOR');

    return result;
  }

  // -------------------------------------------------------------
  // Smart Contract 3: AssetNFT Execution
  // -------------------------------------------------------------

  /**
   * Executes AssetNFT.mint(recipient, name, description, uri)
   * Smart contract enforces authorization: caller must have MINTER_ROLE or be an enrolled DID.
   */
  public async mintNFT(
    callerAddress: string,
    recipientAddress: string,
    tokenName: string,
    description: string,
    uri: string
  ): Promise<{ receipt: EVMTransactionReceipt; tokenId: number }> {
    this.ensureInitialized();
    const caller = callerAddress.toLowerCase();
    const recipient = recipientAddress.toLowerCase();

    // SMART CONTRACT AUTHORIZATION CHECK:
    const minterRole = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
    const hasMinter = this.roles.get(minterRole)?.has(caller) || caller === this.deployer.address.toLowerCase();
    const enrolled = this.isEnrolled(callerAddress);

    if (!hasMinter && !enrolled) {
      throw new Error(
        'AssetNFT: unauthorized - caller lacks MINTER role and is not an enrolled DID in IdentityRegistry'
      );
    }

    const tokenId = this.nextTokenId++;
    const { blockNumber, timestamp } = this.mineBlock();
    const txHash = ethers.keccak256(
      ethers.toUtf8Bytes(`mintNFT_${tokenId}_${caller}_${recipient}_${blockNumber}_${timestamp}_${Math.random()}`)
    );

    this.nfts.set(tokenId, {
      id: tokenId,
      name: tokenName,
      description,
      uri: uri || `ipfs://bafybeig.../${tokenId}`,
      minter: callerAddress,
      owner: recipientAddress,
      mintedAt: timestamp,
    });

    // Save to DB
    const insertNft = db.prepare(`
      INSERT OR REPLACE INTO nfts (id, token_id, name, description, owner_address, minter_address, token_uri, tx_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNft.run(
      `nft_${tokenId}_${timestamp}`,
      tokenId,
      tokenName,
      description,
      recipientAddress,
      callerAddress,
      uri || `ipfs://bafybeig.../${tokenId}`,
      txHash,
      new Date(timestamp * 1000).toISOString()
    );

    // Fire Event
    const rawEvent = {
      contractAddress: this.assetNFTAddress,
      contractName: 'AssetNFT',
      eventName: 'NFTMinted',
      transactionHash: txHash,
      blockNumber,
      timestamp,
      actor: callerAddress,
      args: {
        tokenId,
        minter: callerAddress,
        recipient: recipientAddress,
        tokenName,
      },
    };

    eventCollector.processEvent(rawEvent);

    return {
      tokenId,
      receipt: {
        transactionHash: txHash,
        blockNumber,
        from: callerAddress,
        to: this.assetNFTAddress,
        status: 1,
        events: [{ eventName: 'NFTMinted', args: rawEvent.args }],
      },
    };
  }

  /**
   * Executes AssetNFT.transfer(to, tokenId)
   */
  public async transferNFT(
    callerAddress: string,
    toAddress: string,
    tokenId: number
  ): Promise<EVMTransactionReceipt> {
    this.ensureInitialized();
    const caller = callerAddress.toLowerCase();
    const nft = this.nfts.get(tokenId);

    if (!nft) {
      throw new Error(`AssetNFT: token #${tokenId} does not exist`);
    }

    // Smart contract ownership authorization check
    if (nft.owner.toLowerCase() !== caller) {
      throw new Error(`AssetNFT: caller ${callerAddress} is not the owner of token #${tokenId}`);
    }

    const { blockNumber, timestamp } = this.mineBlock();
    const txHash = ethers.keccak256(
      ethers.toUtf8Bytes(`transferNFT_${tokenId}_${caller}_${toAddress}_${blockNumber}_${timestamp}_${Math.random()}`)
    );

    const fromAddress = nft.owner;
    nft.owner = toAddress;

    // Update in DB
    db.prepare('UPDATE nfts SET owner_address = ? WHERE token_id = ?').run(toAddress, tokenId);

    // Emit TransferRequested and TransferCompleted
    eventCollector.processEvent({
      contractAddress: this.assetNFTAddress,
      contractName: 'AssetNFT',
      eventName: 'TransferRequested',
      transactionHash: txHash,
      blockNumber,
      timestamp,
      actor: callerAddress,
      args: {
        tokenId,
        from: fromAddress,
        to: toAddress,
      },
    });

    eventCollector.processEvent({
      contractAddress: this.assetNFTAddress,
      contractName: 'AssetNFT',
      eventName: 'TransferCompleted',
      transactionHash: txHash,
      blockNumber,
      timestamp,
      actor: callerAddress,
      args: {
        tokenId,
        from: fromAddress,
        to: toAddress,
      },
    });

    return {
      transactionHash: txHash,
      blockNumber,
      from: callerAddress,
      to: this.assetNFTAddress,
      status: 1,
      events: [
        { eventName: 'TransferRequested', args: { tokenId, from: fromAddress, to: toAddress } },
        { eventName: 'TransferCompleted', args: { tokenId, from: fromAddress, to: toAddress } },
      ],
    };
  }

  public getAllNFTs() {
    return Array.from(this.nfts.values());
  }

  public getNFTsByOwner(ownerAddress: string) {
    const owner = ownerAddress.toLowerCase();
    return Array.from(this.nfts.values()).filter((nft) => nft.owner.toLowerCase() === owner);
  }

  /**
   * Reset the local EVM state
   */
  public resetState() {
    this.identities.clear();
    this.didToController.clear();
    this.roles.clear();
    this.nfts.clear();
    this.nextTokenId = 1;
    this.blockNumber = 1000;
    this.initialized = false;
    this.ensureInitialized();
    db.prepare('DELETE FROM nfts').run();
  }
}

export const localEVM = new LocalEVM();
