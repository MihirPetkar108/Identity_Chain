# SIH125 — One-Shot End-to-End Prototype Implementation Plan

## Goal

Build the complete prototype end-to-end: authentication → DID → smart-contract-controlled NFT/transfer/role operations → local EVM events → rolling 10-minute activity features → transparent rule detection + Isolation Forest interface/mock → advisory risk result → Auditor Risk Panel.

Keep the UI simple, minimalist, technical, and demonstrable. Do **not** implement the actual ML models; make the architecture and integration points evident.

## Core Architecture

```text
SIGN UP / SIGN IN
        ↓
USER DASHBOARD
        ↓
DID / IDENTITY
        ↓
SMART CONTRACT AUTHORIZATION
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
RULE ENGINE + ISOLATION FOREST INTERFACE
        ↓
ADVISORY RISK RESULT
        ↓
AUDITOR RISK PANEL
```

**Critical rule:** ML/risk analysis must never grant/revoke roles, move assets, lock identities, or approve transactions. Smart contracts remain the sole authorization layer.

---

# 1. Authentication

Implement:

- Sign up
- Sign in
- Sign out
- Secure session persistence
- Protected routes
- User profile

Suggested routes:

```text
/login
/signup
/dashboard
/auditor
```

Authentication is application-level only. Do not use the DID key as the normal application login mechanism.

---

# 2. DID / Identity

Each authenticated user should be able to create/connect an associated DID.

Display:

```text
DID
 did:example:...

Status
 ● Verified

Controller
 0x...

Verification Method
 appropriate existing DID method
```

Maintain the separation:

```text
Application User
      ↓
DID Identity
      ↓
DID Key / Controller
```

Never expose or insecurely store a DID private key.

---

# 3. Local EVM

Use the existing local EVM if the repository already has one. Otherwise use a lightweight development chain such as Anvil or Hardhat.

Deploy a minimal contract set representing:

```text
IdentityRegistry
    ├── DID/controller registration
    └── controller → identity mapping

RoleManager
    ├── grant role
    ├── revoke role
    └── role verification

NFT / Asset Contract
    ├── mint
    └── transfer
```

Do not create fake AI authorization. Blockchain contracts must perform the actual authorization.

---

# 4. NFT Minting

Authenticated users should be able to mint an NFT using the existing DID/key authorization flow.

Minimal UI:

```text
Mint NFT

Name
[________________]

Description
[________________]

Recipient
[________________]

[ Mint NFT ]
```

Flow:

```text
Authenticated User
      ↓
DID Authorization / Signature
      ↓
Smart Contract
      ↓
EVM Transaction
      ↓
NFT Minted
      ↓
NFT_MINT Event
```

The transaction should generate a real blockchain event consumed by the activity pipeline.

---

# 5. NFT Transfer

Implement a basic transfer flow:

```text
Transfer NFT

NFT
[ NFT #12 ]

Recipient
[ 0x........ ]

[ Transfer ]
```

Flow:

```text
User
 ↓
DID authorization
 ↓
Smart contract
 ↓
Transfer
 ↓
Transfer event
 ↓
Activity pipeline
```

---

# 6. Role Changes

Implement simple role management because role changes are one of the behavioral features.

Example UI:

```text
Identity / Roles

0x1234...

Current roles:
ADMIN
MINTER

[ Grant Role ]
[ Revoke Role ]
```

Generate events such as:

```text
RoleGranted
RoleRevoked
```

Only smart-contract authorization should determine whether the role operation succeeds.

---

# 7. Recently Enrolled Identities

Implement a simple identity enrollment mechanism.

```text
Identity Registry

[ Enroll Identity ]

DID
[ did:example:123 ]

Controller
[ 0x123... ]

[ Enroll ]
```

Store the enrollment timestamp.

The activity engine should be able to determine whether a transfer/mint involves an identity enrolled within the prototype's configured recent period.

This supports the feature:

```text
transfers/mints involving recently enrolled identities
```

---

# 8. Blockchain Event Collector

Create a backend event listener:

```text
Blockchain
    ↓
Event Listener
    ↓
Normalized Activity Events
    ↓
Database
```

Normalize relevant events into a common structure, for example:

```json
{
  "id": "event-123",
  "timestamp": "...",
  "actor": "0x123...",
  "controller": "0x123...",
  "type": "NFT_MINT",
  "transactionHash": "0xabc...",
  "target": "0x456...",
  "metadata": {}
}
```

Possible event types:

```text
ROLE_GRANTED
ROLE_REVOKED
NFT_MINT
TRANSFER_REQUEST
TRANSFER_COMPLETED
IDENTITY_ENROLLED
```

This normalized event stream is the foundation of the ML/risk pipeline.

---

# 9. Rolling 10-Minute Activity Engine

For each actor/controller, calculate a rolling window covering:

```text
NOW - 10 MINUTES
```

Calculate:

```text
totalActions
roleChanges
nftMints
transferRequests
completedTransfers
uniqueRecipients
recentIdentityInteractions
```

Example:

```json
{
  "actor": "0x123...",
  "window": "10m",
  "totalActions": 18,
  "roleChanges": 3,
  "nftMints": 8,
  "transferRequests": 4,
  "completedTransfers": 3,
  "uniqueRecipients": 7,
  "recentIdentityInteractions": 2
}
```

Make this feature object visible in the prototype so evaluators can see exactly what feeds the risk system.

---

# 10. ML Layer — Architecture Only

Do **not** implement the actual ML models.

Create an `MLAnalysisService` interface so the real model can be plugged in later.

Conceptually:

```text
Activity Features
       ↓
MLAnalysisService
       ├── Rule Engine
       ├── Isolation Forest Adapter
       └── Risk Aggregator
       ↓
Risk Result
```

The Isolation Forest implementation should be a deterministic synthetic/mock adapter for the prototype.

Clearly label its output as:

```text
Prototype / Synthetic ML Signal
```

Do not present synthetic values as real-world fraud probabilities or accuracy claims.

---

# 11. Rule Engine

Actually implement the transparent rule engine.

Use configurable prototype thresholds such as:

```text
totalActions > 15
nftMints > 5
roleChanges > 2
uniqueRecipients > 5
recentIdentityInteractions > 2
```

These are prototype thresholds only and are not claims about real-world fraud.

Example result:

```json
{
  "triggeredRules": [
    "HIGH_ACTION_VOLUME",
    "MULTIPLE_NFT_MINTS",
    "MULTIPLE_RECIPIENTS"
  ]
}
```

Keep thresholds easy to change for demonstrations.

---

# 12. Isolation Forest Placeholder

Create the interface:

```text
IsolationForestAnalyzer

analyze(features)
    ↓
{
    anomalyScore,
    anomalyPercentile,
    largestDeviations
}
```

Use deterministic/mock synthetic output, for example:

```json
{
  "anomalyScore": 0.81,
  "anomalyPercentile": 96,
  "largestDeviations": [
    {
      "feature": "nftMints",
      "value": 8,
      "baseline": 1.4
    },
    {
      "feature": "uniqueRecipients",
      "value": 7,
      "baseline": 2.1
    }
  ]
}
```

Clearly identify this as synthetic/prototype output.

---

# 13. Risk Aggregation

Combine:

```text
Rule results
+
Isolation Forest placeholder
```

into an advisory risk result:

```json
{
  "riskScore": 82,
  "anomalyPercentile": 96,
  "severity": "HIGH",
  "triggeredRules": [
    "HIGH_ACTION_VOLUME",
    "MULTIPLE_NFT_MINTS"
  ],
  "anomalyScore": 0.81,
  "largestDeviations": []
}
```

The risk score is advisory only.

**It must never call a blockchain authorization function.**

---

# 14. Auditor Risk Panel

This is the centerpiece of the prototype.

Keep it minimalist and technical.

Example:

```text
AUDITOR
──────────────────────────────────────

Activity Risk

Actor
0x7A3...91F

Risk
82 / 100

Anomaly
96th percentile

Status
● REVIEW

──────────────────────────────────────

10 MIN ACTIVITY

Actions              18
NFT Mints             8
Role Changes          3
Transfers             7
Unique Recipients     7
Recent Identities     2

──────────────────────────────────────

TRIGGERED RULES

⚠ HIGH_ACTION_VOLUME
⚠ MULTIPLE_NFT_MINTS
⚠ MULTIPLE_RECIPIENTS

──────────────────────────────────────

LARGEST DEVIATIONS

NFT Mints
8 vs baseline 1.4

Recipients
7 vs baseline 2.1

──────────────────────────────────────

Blockchain Authorization

✓ Controlled by smart contract

AI authorization
✕ Not permitted
```

The final authorization section should explicitly reinforce that AI is advisory only.

---

# 15. Auditor Activity Timeline

Add a simple event timeline:

```text
10:04:21   NFT Mint
10:05:03   NFT Mint
10:05:44   Transfer Request
10:06:12   Role Change
10:07:01   NFT Mint
10:07:42   Transfer Completed
10:08:10   NFT Mint
```

Clicking an event should show relevant blockchain evidence:

```text
Transaction
0xabc...

Actor
0x123...

Event
NFT_MINT

Block
#14231

Timestamp
...

Contract
0x...

Recipients
...
```

This connects the advisory ML output to actual blockchain activity.

---

# 16. Main Application Pages

Keep the prototype to approximately five main pages.

## `/`

Landing/dashboard:

```text
Decentralized Identity & Asset Platform

[ Sign In ]

Network
Local EVM ●

Contracts
4 deployed

Events
128
```

## `/login`

Simple authentication.

## `/dashboard`

User dashboard:

```text
My Identity
DID
 did:...

Controller
0x...

Status
Verified

My Assets

NFT #1
NFT #2
NFT #3

Actions

[ Mint NFT ]
[ Transfer NFT ]
```

## `/identity`

Identity/DID management:

```text
DID

did:example:...

Controller
0x...

Verification
✓ Valid

Roles

MINTER
USER
```

## `/auditor`

Auditor panel containing the ML/risk demonstration.

---

# 17. Minimal Navigation

Logged out:

```text
Logo

Home
About

Sign In
Sign Up
```

Logged in:

```text
Logo

Dashboard
Identity
Mint
Auditor

User
0x123...

Sign Out
```

UI requirements:

- White or very light background
- Dark text
- Thin borders
- Small border radius
- One accent color
- Monospace font for addresses/hashes
- Compact cards
- Minimal shadows
- Technical dashboard feel rather than marketing-heavy design

---

# 18. Suggested Technical Architecture

If the existing project does not already dictate a stack, use something straightforward:

```text
Frontend
Next.js / React
        │
        │ REST/API
        ▼
Backend
Node.js / TypeScript
        │
        ├───────────────┐
        ▼               ▼
Database          Local EVM
PostgreSQL        Hardhat/Anvil
        │               │
        │               ▼
        │        Smart Contracts
        │               │
        └───────┬───────┘
                ▼
        Activity Engine
                │
                ▼
        Risk/ML Interface
                │
                ▼
        Auditor Panel
```

If the existing application already has a stack, **keep that stack instead of rewriting it**.

---

# 19. Database

Keep the schema small.

Potential tables:

```text
users
dids
identities
nfts
activity_events
risk_assessments
```

## `users`

```text
id
email
password_hash
created_at
```

## `dids`

```text
id
user_id
did_identifier
controller_address
created_at
```

## `activity_events`

```text
id
actor
event_type
transaction_hash
block_number
timestamp
target
metadata
```

## `risk_assessments`

```text
id
actor
window_start
window_end
risk_score
anomaly_score
anomaly_percentile
triggered_rules
largest_deviations
created_at
```

No elaborate data warehouse is required for the prototype.

---

# 20. Authentication + DID + Authorization

Maintain this separation:

```text
Application Authentication
          │
          ▼
      User Account
          │
          ▼
      DID Identity
          │
          ▼
    DID Authorization
          │
          ▼
    Smart Contract
          │
          ▼
    Blockchain Action
```

The ML system sits beside this flow, not inside authorization:

```text
                    ┌───────────────┐
                    │ Smart Contract│
                    │ Authorization │
                    └───────┬───────┘
                            │
                            ▼
                       Blockchain
                            │
                            ▼
                         Events
                            │
                            ▼
                    Activity Features
                            │
                            ▼
                      ML / Rules
                            │
                            ▼
                      Risk Signal
                            │
                            ▼
                        Auditor
```

This distinction must exist in both code and UI.

---

# 21. Prototype Demo Scenario

Seed the application with a normal and an unusual actor.

## Normal Actor

Generate activity such as:

```text
2 actions
1 NFT mint
1 transfer
1 recipient
0 role changes
```

Display a low advisory signal.

## Unusual Actor

Generate:

```text
18 actions
8 NFT mints
3 role changes
7 transfers
7 recipients
2 recent identities
```

Display a high advisory signal and synthetic 96th-percentile anomaly result.

This provides an immediate before/after demonstration without implementing the actual ML model.

---

# 22. Synthetic Activity Generator

Add developer/demo controls:

```text
Demo Controls

[ Generate Normal Activity ]
[ Generate Suspicious Activity ]
[ Clear Activity ]
```

Where practical, the generator should create legitimate synthetic blockchain transactions through the local EVM rather than merely inserting fake database rows.

Desired flow:

```text
Demo Generator
      ↓
Local EVM
      ↓
Smart Contract Events
      ↓
Event Collector
      ↓
10-min Feature Window
      ↓
Rule Engine
      ↓
ML Placeholder
      ↓
Risk Assessment
      ↓
Auditor Panel
```

This makes the demonstration substantially stronger.

---

# 23. GlobeX Reference

If GlobeX is an existing project/repository whose blockchain architecture is useful as a reference, use it only where appropriate.

Do not blindly copy its implementation.

Prioritize:

```text
existing project architecture
        >
existing DID implementation
        >
existing EVM/contracts
        >
GlobeX architectural reference
        >
new dependencies
```

The goal is a working prototype, not a rewrite.

---

# 24. One-Shot Implementation Sequence

Execute in this order:

```text
PHASE 1
Inspect existing repository
        ↓
Determine stack
        ↓
Identify existing DID/NFT/EVM functionality

PHASE 2
Set up database
        ↓
Authentication
        ↓
User sessions
        ↓
Protected routes

PHASE 3
DID association
        ↓
Identity registry
        ↓
Controller mapping

PHASE 4
Deploy/use local EVM
        ↓
Deploy contracts
        ↓
NFT mint
        ↓
NFT transfer
        ↓
Role changes
        ↓
Identity enrollment

PHASE 5
Blockchain event listener
        ↓
Normalize events
        ↓
Persist events

PHASE 6
10-minute activity aggregation
        ↓
Feature generation

PHASE 7
Rule engine
        +
Isolation Forest interface/mock
        ↓
Risk aggregation

PHASE 8
Auditor panel
        ↓
Risk score
        ↓
Anomaly percentile
        ↓
Rules
        ↓
Deviations
        ↓
Timeline

PHASE 9
Synthetic/demo activity
        ↓
Normal scenario
        ↓
Suspicious scenario

PHASE 10
End-to-end testing
        ↓
Security review
        ↓
UI cleanup
        ↓
README
```

---

# 25. Definition of Done

The agent should **not stop after creating UI screens**.

The complete path must work:

```text
SIGN UP
   ↓
SIGN IN
   ↓
DASHBOARD
   ↓
DID ASSOCIATED
   ↓
NFT MINT
   ↓
SMART CONTRACT AUTHORIZATION
   ↓
EVM TRANSACTION
   ↓
BLOCKCHAIN EVENT
   ↓
EVENT COLLECTOR
   ↓
ACTIVITY EVENT
   ↓
10-MINUTE WINDOW
   ↓
FEATURE EXTRACTION
   ↓
RULE ENGINE
   +
ISOLATION FOREST INTERFACE
   ↓
ADVISORY RISK RESULT
   ↓
AUDITOR RISK PANEL
```

Security paths must also work:

```text
Unauthenticated
      ↓
Cannot mint

Authenticated
      ↓
No valid DID authorization
      ↓
Cannot mint

Authenticated
      +
Valid DID
      +
Smart-contract authorization
      ↓
Mint succeeds
```

The ML/risk layer must **never** appear in the authorization path.

---

# 26. Final Instruction to the AI Coding Agent

> **Build the prototype completely, not just the individual screens. Start by inspecting the existing repository and preserve working functionality. Implement the full end-to-end flow from authentication to DID association, smart-contract-controlled NFT/transfer/role operations, local EVM event collection, rolling 10-minute feature aggregation, transparent rule-based detection, and an Isolation Forest interface with synthetic/mock output. Build the Auditor Risk Panel so the ML architecture is visibly demonstrated, but do not implement the actual ML models. Use synthetic/demo activity to make the risk pipeline demonstrable. Keep the UI minimalist and technical. Most importantly, never allow the ML/risk system to grant, revoke, or influence blockchain authorization—the smart contracts remain the sole authorization layer. Finish by testing the entire application flow locally and provide clear setup/run instructions. Do not leave placeholder pages or disconnected mock UI; every major screen should connect to the underlying prototype functionality.**
'''
Path('/mnt/data/SIH125_one_shot_prototype_implementation_plan.md').write_text(content, encoding='utf-8')
