# Identity Chain — SIH125 One-Shot Prototype

An end-to-end decentralized identity (DID) & smart-contract-authorized asset platform integrated with a rolling 10-minute behavioral activity engine and an advisory **Auditor Risk Panel** powered by transparent rule engines and Isolation Forest adapters.

---

## 🏛 Core Architecture

```text
SIGN UP / SIGN IN
        ↓
USER DASHBOARD
        ↓
DID / IDENTITY BINDING
        ↓
SMART CONTRACT AUTHORIZATION (IdentityRegistry.sol, RoleManager.sol, AssetNFT.sol)
        ↓
NFT / TRANSFER / ROLE OPERATIONS
        ↓
LOCAL EVM EVENTS
        ↓
EVENT COLLECTOR
        ↓
ROLLING 10-MINUTE ACTIVITY WINDOW
        ↓
FEATURE EXTRACTION
        ↓
RULE ENGINE + ISOLATION FOREST ADAPTER (Deterministic Synthetic ML Signal)
        ↓
ADVISORY RISK RESULT
        ↓
AUDITOR RISK PANEL
```

### 🔒 Sole Authorization Layer Guarantee
> **CRITICAL ARCHITECTURAL RULE:** Smart contracts are the **sole authorization layer** on-chain. The AI and ML risk scoring layer is **strictly advisory** and is **never** permitted to grant/revoke roles, move assets, lock identities, or approve blockchain transactions.

---

## 🚀 Key Features

1. **Application Authentication & DID Separation**:
   - User credentials use standard bcrypt & JWT session management.
   - Decoupled DID Identity (`did:ethr:0x...` / `did:key:...`) bound to an EVM controller address.
   - DID private keys are isolated and never used as web login passwords.

2. **Solidity Smart Contracts on Local EVM**:
   - [`IdentityRegistry.sol`](contracts/IdentityRegistry.sol): DID registration, controller binding, and enrollment timestamps.
   - [`RoleManager.sol`](contracts/RoleManager.sol): RBAC (`ADMIN`, `MINTER`, `OPERATOR`, `AUDITOR`) with `RoleGranted` & `RoleRevoked` events.
   - [`AssetNFT.sol`](contracts/AssetNFT.sol): Verifiable asset minting & transfers with `NFTMinted`, `TransferRequested`, `TransferCompleted` events.

3. **Blockchain Event Collector**:
   - Ingests raw EVM block logs and normalizes them into structured activity events stored in SQLite.

4. **Rolling 10-Minute Activity Window**:
   - Extracts real-time features for each actor across `[NOW - 10 min, NOW]`:
     - `totalActions`
     - `nftMints`
     - `roleChanges`
     - `transferRequests`
     - `completedTransfers`
     - `uniqueRecipients`
     - `recentIdentityInteractions` (identities enrolled within the past hour)

5. **Transparent Rule Engine & Isolation Forest Adapter**:
   - **Rule Engine**: Evaluates transparent thresholds (`HIGH_ACTION_VOLUME`, `MULTIPLE_NFT_MINTS`, `MULTIPLE_ROLE_CHANGES`, `MULTIPLE_RECIPIENTS`, `RECENT_IDENTITY_INTERACTIONS`, `RAPID_TRANSFERS`).
   - **Isolation Forest Interface (`IIsolationForestAnalyzer`)**: Calibrated against baseline normal activity metrics to produce synthetic anomaly scores and percentiles labeled explicitly as *Prototype / Synthetic ML Signal*.
   - **Risk Aggregator**: Blends signals into an advisory risk score (0-100) and severity rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

6. **Auditor Risk Panel**:
   - Minimalist, high-density technical dashboard.
   - Live 10-minute feature metrics table.
   - Triggered rules breakdown & largest deviations (observed vs baseline).
   - Explicit Blockchain Authorization vs AI Non-Authoritative status indicators.
   - Interactive event timeline with full cryptographic evidence inspection (Tx hash, block number, actor, contract, raw payload).
   - Developer Demo Controls (`Normal Activity`, `Suspicious Activity`, `Reset`).

---

## 📦 Quick Start & Setup

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Compile Solidity smart contracts
npm run compile:contracts

# 3. Run full end-to-end verification test suite
npm run test:e2e

# 4. Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 Page Routes

- `/` — Platform Overview, Live EVM Network Status, System Architecture Pipeline.
- `/login` & `/signup` — Application-level user authentication.
- `/dashboard` — User workspace, DID identity card, owned verifiable assets, and on-chain activity.
- `/identity` — DID document inspection, smart contract roles management, and on-chain identity enrollment.
- `/mint` — DID-authorized NFT minting & transfer interface with live transaction receipts.
- `/auditor` — Auditor Risk Panel with live rolling feature extraction, rule engine diagnostics, and demo burst triggers.

---

## 🧪 Verification & Testing

To run the automated 10-stage end-to-end verification pipeline:

```bash
npm run test:e2e
```
