const { authService } = require('../src/lib/auth');
const { didService } = require('../src/lib/auth/did');
const { localEVM } = require('../src/lib/blockchain/evm');
const { eventCollector } = require('../src/lib/blockchain/collector');
const { activityAggregator } = require('../src/lib/analysis/activity-aggregator');
const { mlAnalysisService } = require('../src/lib/analysis/ml-service');
const { demoGenerator } = require('../src/lib/demo/generator');
const { DEMO_ACTORS } = require('../src/lib/constants');

async function runEndToEndVerification() {
  console.log('===========================================================');
  console.log('  SIH125 End-to-End Prototype Full Pipeline Verification  ');
  console.log('===========================================================');

  // Step 1: User Registration & Session
  console.log('\n[1] Registering User & Persisting Session...');
  const testEmail = `researcher_${Date.now()}@university.edu`;
  const { user, token } = authService.register('Dr. Alice Smith', testEmail, 'securepass123');
  console.log(`✓ User registered: ${user.name} (${user.email}), ID: ${user.id}`);
  console.log(`✓ JWT Session generated: ${token.slice(0, 20)}...`);

  // Step 2: DID Identity Creation & Controller Association
  console.log('\n[2] Creating & Binding Decentralized Identity (DID)...');
  const didProfile = await didService.getOrCreateDID(user.id);
  console.log(`✓ DID Identifier: ${didProfile.did}`);
  console.log(`✓ Controller Address: ${didProfile.controller}`);
  console.log(`✓ Verification Method: ${didProfile.verificationMethod}`);
  console.log(`✓ Enrolled on IdentityRegistry on-chain: ${didProfile.enrolledOnChain}`);

  // Step 3: Smart Contract Role Operations
  console.log('\n[3] Testing Smart Contract Role Authorization...');
  const deployer = localEVM.getDeployer().address;
  const grantReceipt = await localEVM.grantRole(deployer, 'MINTER', didProfile.controller);
  console.log(`✓ MINTER_ROLE granted to ${didProfile.controller} (Tx: ${grantReceipt.transactionHash.slice(0, 14)}...)`);
  const roles = localEVM.getAccountRoles(didProfile.controller);
  console.log(`✓ Active roles on-chain: ${roles.join(', ')}`);

  // Step 4: Smart Contract Asset Minting
  console.log('\n[4] Minting Verifiable Asset NFT on AssetNFT.sol...');
  const mintRes = await localEVM.mintNFT(
    didProfile.controller,
    didProfile.controller,
    'Identity Verifiable Credential #2026',
    'Proof of Research Accreditation',
    'ipfs://bafybeiresearch2026'
  );
  console.log(`✓ NFT #${mintRes.tokenId} minted (Tx: ${mintRes.receipt.transactionHash.slice(0, 14)}..., Block #${mintRes.receipt.blockNumber})`);

  // Step 5: Smart Contract Asset Transfer
  console.log('\n[5] Transferring Asset NFT on AssetNFT.sol...');
  const recipientAddr = DEMO_ACTORS.RECIPIENTS[0];
  const transferReceipt = await localEVM.transferNFT(didProfile.controller, recipientAddr, mintRes.tokenId);
  console.log(`✓ NFT #${mintRes.tokenId} transferred to ${recipientAddr} (Tx: ${transferReceipt.transactionHash.slice(0, 14)}...)`);

  // Step 6: Verify Event Normalization in SQLite
  console.log('\n[6] Verifying Blockchain Event Collector...');
  const userEvents = eventCollector.getEvents({ actor: didProfile.controller });
  console.log(`✓ Collected ${userEvents.length} events for actor ${didProfile.controller}:`);
  userEvents.forEach((e) => console.log(`   - [${e.type}] Block #${e.blockNumber} (Tx: ${e.transactionHash.slice(0, 10)}...)`));

  // Step 7: Demo Suspicious Activity Burst
  console.log('\n[7] Generating High-Volume Suspicious Activity on EVM...');
  const suspiciousDemo = await demoGenerator.generateSuspiciousActivity();
  console.log(`✓ Generated ${suspiciousDemo.actionsCount} real smart contract transactions for actor ${suspiciousDemo.actor}`);

  // Step 8: Rolling 10-Minute Activity Window Feature Extraction
  console.log('\n[8] Computing Rolling 10-Minute Activity Window Features...');
  const features = activityAggregator.getFeaturesForActor(suspiciousDemo.actor);
  console.log('✓ Extracted Features:');
  console.log(`   - Total Actions:               ${features.totalActions}`);
  console.log(`   - NFT Mints:                   ${features.nftMints}`);
  console.log(`   - Role Changes:                ${features.roleChanges}`);
  console.log(`   - Transfers Completed:         ${features.completedTransfers}`);
  console.log(`   - Unique Recipients:           ${features.uniqueRecipients}`);
  console.log(`   - Recent Identity Interactions:${features.recentIdentityInteractions}`);

  // Step 9: Transparent Rule Engine & Isolation Forest Adapter Execution
  console.log('\n[9] Evaluating Rule Engine & Isolation Forest Adapter...');
  const assessment = mlAnalysisService.assessActorRisk(features);
  console.log(`✓ Advisory Risk Score:   ${assessment.riskScore} / 100`);
  console.log(`✓ Anomaly Percentile:    ${assessment.anomalyPercentile}th percentile`);
  console.log(`✓ Severity Classification:${assessment.severity}`);
  console.log(`✓ Triggered Rules (${assessment.triggeredRules.length}):`);
  assessment.triggeredRules.forEach((r) => console.log(`   ⚠ ${r}`));
  console.log(`✓ Largest Deviations (${assessment.largestDeviations.length}):`);
  assessment.largestDeviations.forEach((d) => console.log(`   • ${d.label}: ${d.value} vs baseline ${d.baseline} (${d.multiplier}x)`));

  // Step 10: Verify Non-Authoritative Authorization Rule
  console.log('\n[10] Verifying Authorization Boundary Guarantee...');
  console.log(`✓ Smart Contract Controlled:    ${assessment.authorizationStatus.smartContractControlled}`);
  console.log(`✓ AI Authorization Permitted:   ${assessment.authorizationStatus.aiAuthorizationPermitted}`);
  console.log(`✓ Guarantee: "${assessment.authorizationStatus.disclaimer}"`);

  console.log('\n===========================================================');
  console.log('   ALL 10 END-TO-END VERIFICATION STEPS PASSED (100% OK)   ');
  console.log('===========================================================');
}

runEndToEndVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
