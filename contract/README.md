## Smart Contract Architecture

## Contract Overview

| Contract | Description |
|-----------|--------------|
| **LibUjrah.sol** | Library to calculate *ujrah* (fee/reward) for stakers. |
| **SyariahRegistry.sol** | Manages shariah certification (no *riba*, *gharar*, *maysir*). |
| **AmanahStakesTreasury.sol** | Secure fund custody and controlled release of staking capital. |
| **AmanahStakesCore.sol** | Main staking logic — stake, claim, withdraw (shariah-compliant). |
| **AmanahStakesToken.sol** | NFT / SBT proof of *akad* (optional for visual/record proof). |

---

## SyariahRegistry.sol

### Phase 0: Deployment & Certification
- `submitForReview()` — Admin submits contract for review.  
- `approveReviewAndIssueCertificate()` — Dewan Syariah approves and issues certificate.  
- `rejectReview()` — Dewan Syariah rejects with reason.  
- `revokeSertifikat()` — Revoke certificate with justification.  
- Certificate expiry tracking (auto-check and renewal alerts).

### Phase 1: User Staking Monitoring
- `verifyIjarahContract()` — Verify *ujrah* and lock period parameters.  
- `flagNonCompliantActivity()` — Flag suspicious/violating activity with severity level.

### Phase 2: Operational Verification
- `verifyUjrahCalculation()` — Weekly *ujrah* verification logic.  
- `verifyTreasuryAllocation()` — Ensure treasury allocation matches user funds.  
- `publishComplianceReport()` — Monthly compliance reports for transparency.  
- `catatAudit()` — General audit logging for all events.

### Phase 3: Withdrawal Verification
- `verifyWithdrawal()` — Verify principal + *ujrah* correctness + NFT burn.  
- `alertLargeWithdrawal()` — Trigger alerts on large or abnormal withdrawals.

### Phase 4: Periodic Review
- `publishQuarterlyAudit()` — Quarterly audit publication.  
- `renewSertifikat()` — Renew certification after audit approval.  
- `updateFatwa()` — Update fatwa or shariah guidance references.  
- `suspendOperations()` — Suspend non-compliant operations.

---

## AmanahStakesCore.sol

### Phase 0: Deployment & Certification
- Contract deployed in **PAUSED** state.  
- `unpauseContract()` — Activate only after Syariah certification.  
- `pauseContract()` — Emergency stop for safety.  
- `setTermsHash()` — Update Ijarah terms hash for verification.  
- **Event:** `ContractDeployed`.

### Phase 1: User Staking
- `agreeToIjarahTerms()` — User must agree to terms before staking.  
- `buatAkad()` — Create *akad* with:
  - Certification check  
  - Terms agreement check  
  - Mint NFT as proof  
- `approveAkad()` — Dewan Syariah approval of *akad*.  
- `approveAkadBatch()` — Batch approval for efficiency.  
- **Events:** `IjarahAgreementSigned`, `AkadCreated`.

### Phase 2: Operational Staking
- `harvestStakingRewards()` — Harvest from protocol.  
- `distributeUjrah()` — Pay single user’s *ujrah*.  
- `distributeUjrahBatch()` — Batch distribution for lower gas cost.  
- **Events:** `RewardsHarvested`, `UjrahDistributed`.

### Phase 3: Withdrawal
- `requestWithdrawal()` — User initiates withdrawal request.  
- `executeWithdrawal()` — Process withdrawal + burn NFT proof.  
- `executeWithdrawalBatch()` — Batch withdrawal execution.  
- `verifyWithdrawalEligibility()` — Check eligibility for auditor.  
- **Events:** `WithdrawalRequested`, `WithdrawalCompleted`, `AkadNFTBurned`.

---

## AmanahStakesTreasury.sol

- `deposit(), receive()` — Deposit funds
- `withdraw() with audit trail` — Withdraw with purpose
- `emergencyWithdraw() ` — Emergency withdraw
- `withdrawalHistory[] ` — Withdrawal history
- `getTreasuryStats()` — Treasury stats

---

## AmanahStakesToken.sol

- `mint()` — Mint NFT as akad proof 
- `burn()` — Burn NFT on withdrawal
- `_update() ` — Soul Bound Token (non-transferable)
- Base URI + custom URI per token — Metadata support
- `tokensOfOwner(), exists(), etc` — View functions

---
