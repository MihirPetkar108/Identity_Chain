import { ethers } from 'ethers';
import { localEVM } from '../blockchain/evm';
import { eventCollector } from '../blockchain/collector';
import { DEMO_ACTORS } from '../constants';

export class DemoGenerator {
  /**
   * Generates authentic blockchain transactions for a normal actor
   */
  public async generateNormalActivity(): Promise<{ actor: string; actionsCount: number; events: string[] }> {
    const actor = DEMO_ACTORS.NORMAL_USER;
    const eventsGenerated: string[] = [];

    // 1. Enroll normal user DID if not enrolled
    if (!localEVM.isEnrolled(actor)) {
      await localEVM.enrollIdentity(actor, 'did:key:z6MknC1g48vYwG1hYndV51fppLvvLgkU1k2', actor);
      eventsGenerated.push('IdentityEnrolled');
    }

    // 2. Mint 1 standard NFT
    const mint1 = await localEVM.mintNFT(
      actor,
      actor,
      'Verifiable Research Credential',
      'Proof of Academic Identity verification',
      'ipfs://bafybeicredential1'
    );
    eventsGenerated.push('NFTMinted');

    // 3. Transfer to 1 recipient
    const recipient = DEMO_ACTORS.RECIPIENTS[0];
    await localEVM.transferNFT(actor, recipient, mint1.tokenId);
    eventsGenerated.push('TransferCompleted');

    return {
      actor,
      actionsCount: eventsGenerated.length,
      events: eventsGenerated,
    };
  }

  /**
   * Generates a burst of transactions for a suspicious actor exhibiting anomalous patterns
   */
  public async generateSuspiciousActivity(): Promise<{ actor: string; actionsCount: number; events: string[] }> {
    const actor = DEMO_ACTORS.SUSPICIOUS_ACTOR;
    const deployer = localEVM.getDeployer().address;
    const eventsGenerated: string[] = [];

    // 1. Enroll Suspicious Actor identity
    if (!localEVM.isEnrolled(actor)) {
      await localEVM.enrollIdentity(actor, 'did:key:z6MkqZt8Wv9X8b2N4kL1f91F099191F', actor);
      eventsGenerated.push('IdentityEnrolled');
    }

    // 2. Enroll 2 recent identities
    for (const recent of DEMO_ACTORS.RECENT_IDENTITIES) {
      if (!localEVM.isEnrolled(recent.address)) {
        await localEVM.enrollIdentity(actor, recent.did, recent.address);
        eventsGenerated.push('IdentityEnrolled');
      }
    }

    // 3. Rapid Role changes (3 role operations)
    await localEVM.grantRole(deployer, 'OPERATOR', actor);
    eventsGenerated.push('RoleGranted');
    await localEVM.grantRole(deployer, 'MINTER', actor);
    eventsGenerated.push('RoleGranted');
    await localEVM.revokeRole(deployer, 'OPERATOR', actor);
    eventsGenerated.push('RoleRevoked');

    // 4. Burst of 8 NFT mints
    const mintedTokenIds: number[] = [];
    for (let i = 1; i <= 8; i++) {
      const res = await localEVM.mintNFT(
        actor,
        actor,
        `High-Frequency Asset Token #${i}`,
        `Batch minted asset batch-989 item ${i}`,
        `ipfs://bafybeihighfreq/${i}`
      );
      mintedTokenIds.push(res.tokenId);
      eventsGenerated.push('NFTMinted');
    }

    // 5. 7 rapid transfers to 7 unique recipients (including recent identities)
    for (let i = 0; i < 7 && i < mintedTokenIds.length; i++) {
      const recipient =
        i < DEMO_ACTORS.RECENT_IDENTITIES.length
          ? DEMO_ACTORS.RECENT_IDENTITIES[i].address
          : DEMO_ACTORS.RECIPIENTS[i % DEMO_ACTORS.RECIPIENTS.length];

      await localEVM.transferNFT(actor, recipient, mintedTokenIds[i]);
      eventsGenerated.push('TransferRequested');
      eventsGenerated.push('TransferCompleted');
    }

    return {
      actor,
      actionsCount: eventsGenerated.length,
      events: eventsGenerated,
    };
  }

  /**
   * Resets all activities and EVM state
   */
  public resetAll() {
    eventCollector.clearAllEvents();
    localEVM.resetState();
  }
}

export const demoGenerator = new DemoGenerator();
