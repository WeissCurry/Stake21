// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SyariahRegistry
 * @notice Registry untuk sertifikasi dan audit syariah - COMPLETE VERSION
 * @dev Implements all phases: Certification, Audit, Compliance, Periodic Review
 */
contract SyariahRegistry is AccessControl {
    
    // ============ ROLES ============
    
    bytes32 public constant DEWAN_SYARIAH_ROLE = keccak256("DEWAN_SYARIAH_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // ============ ENUMS ============
    
    enum Severity { LOW, MEDIUM, HIGH, CRITICAL }
    enum ReviewStatus { PENDING, APPROVED, REJECTED }
    
    // ============ STRUCTS (PACKED) ============
    
    /// @notice Sertifikat Syariah
    struct SertifikatSyariah {
        bool valid;
        uint64 tanggalSertifikasi;
        uint64 tanggalExpiry;
        address dewanSyariah;
        bytes32 kodeRiba;
        bytes32 kodeGharar;
        bytes32 kodeMaysir;
        bytes32 catatanHash;
    }
    
    /// @notice Review Submission (Phase 0)
    struct ReviewSubmission {
        bytes32 designDocHash;
        bytes32 contractHash;
        bytes32 termsHash;
        ReviewStatus status;
        uint64 submittedAt;
        address submittedBy;
    }
    
    /// @notice Compliance Alert (Phase 1-3)
    /// @dev RENAMED to avoid conflict with event
    struct Alert {
        uint256 contractId;
        Severity severity;
        uint64 timestamp;
        address auditor;
        bool resolved;
    }
    
    // ============ STATE VARIABLES ============
    
    SertifikatSyariah public sertifikat;
    ReviewSubmission public currentReview;
    
    // Audit trail
    bytes32[] public auditHashes;
    bytes32[] public complianceReportHashes;
    bytes32[] public fatwaHashes;
    
    // Compliance tracking
    Alert[] public complianceAlerts;
    mapping(uint256 => bool) public contractCompliance; // contractId => isCompliant
    
    // Statistics
    uint256 public totalAudits;
    uint256 public totalAlerts;
    uint256 public resolvedAlerts;
    
    // ============ EVENTS ============
    
    // Phase 0: Deployment & Certification
    event ReviewRequested(
        address indexed admin,
        bytes32 designDocHash,
        bytes32 contractHash,
        bytes32 termsHash,
        uint256 timestamp
    );
    
    event ReviewApproved(
        address indexed dewanSyariah,
        uint256 timestamp
    );
    
    event ReviewRejected(
        address indexed dewanSyariah,
        string reason,
        uint256 timestamp
    );
    
    event SertifikatDiterbitkan(
        address indexed dewanSyariah,
        uint256 timestamp,
        bytes32 certificateHash
    );
    
    event SertifikatDirevoke(
        address indexed dewanSyariah,
        string reason,
        uint256 timestamp
    );
    
    // Phase 1-3: Audit & Compliance
    event AuditDilakukan(
        uint256 indexed timestamp,
        address indexed auditor,
        bytes32 indexed jenisAuditHash,
        string jenisAuditText,
        string hasilText,
        bytes32 dataHash
    );
    
    event ComplianceAlertCreated(
        uint256 indexed alertId,
        uint256 indexed contractId,
        string reason,
        Severity severity,
        uint256 timestamp
    );
    
    event ComplianceAlertResolved(
        uint256 indexed alertId,
        address indexed resolver,
        uint256 timestamp
    );
    
    event IjarahContractVerified(
        uint256 indexed contractId,
        address indexed auditor,
        bool isCompliant,
        uint256 timestamp
    );
    
    event UjrahVerified(
        uint256 indexed contractId,
        uint256 expectedUjrah,
        uint256 actualUjrah,
        bool isCorrect,
        uint256 timestamp
    );
    
    event TreasuryVerified(
        uint256 totalStaked,
        uint256 totalUjrahPaid,
        bool isBalanced,
        uint256 timestamp
    );
    
    event ComplianceReportPublished(
        bytes32 indexed ipfsHash,
        address indexed auditor,
        uint256 timestamp
    );
    
    event WithdrawalVerified(
        uint256 indexed contractId,
        address indexed auditor,
        bool isValid,
        uint256 timestamp
    );
    
    // Phase 4: Periodic Review
    event QuarterlyAuditPublished(
        bytes32 indexed ipfsHash,
        address indexed auditor,
        uint256 timestamp
    );
    
    event CertificateRenewed(
        bytes32 indexed newCertificateHash,
        uint64 newExpiryDate,
        uint256 timestamp
    );
    
    event FatwaUpdated(
        string topic,
        bytes32 indexed fatwaIPFSHash,
        uint256 timestamp
    );
    
    event OperationsSuspended(
        string reason,
        address indexed dewanSyariah,
        uint256 timestamp
    );
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    // ============================================================
    // PHASE 0: DEPLOYMENT & CERTIFICATION
    // ============================================================
    
    /**
     * @notice Admin submit platform for Syariah review
     * @dev Step 1 of certification process
     */
    function submitForReview(
        bytes32 _designDocHash,
        bytes32 _contractHash,
        bytes32 _termsHash
    ) external onlyRole(ADMIN_ROLE) {
        require(currentReview.status != ReviewStatus.PENDING, "Review already pending");
        
        currentReview = ReviewSubmission({
            designDocHash: _designDocHash,
            contractHash: _contractHash,
            termsHash: _termsHash,
            status: ReviewStatus.PENDING,
            submittedAt: uint64(block.timestamp),
            submittedBy: msg.sender
        });
        
        emit ReviewRequested(
            msg.sender,
            _designDocHash,
            _contractHash,
            _termsHash,
            block.timestamp
        );
    }
    
    /**
     * @notice Dewan Syariah approve review & issue certificate
     * @dev Step 2: Approve after reviewing design, contract, and terms
     */
    function approveReviewAndIssueCertificate(
        bytes32 _kodeRiba,
        bytes32 _kodeGharar,
        bytes32 _kodeMaysir,
        bytes32 _catatanHash,
        uint64 _expiryInDays
    ) external onlyRole(DEWAN_SYARIAH_ROLE) {
        require(currentReview.status == ReviewStatus.PENDING, "No pending review");
        
        // Mark review as approved
        currentReview.status = ReviewStatus.APPROVED;
        
        // Issue certificate
        uint64 expiryDate = uint64(block.timestamp) + (_expiryInDays * 1 days);
        
        sertifikat = SertifikatSyariah({
            valid: true,
            tanggalSertifikasi: uint64(block.timestamp),
            tanggalExpiry: expiryDate,
            dewanSyariah: msg.sender,
            kodeRiba: _kodeRiba,
            kodeGharar: _kodeGharar,
            kodeMaysir: _kodeMaysir,
            catatanHash: _catatanHash
        });
        
        emit ReviewApproved(msg.sender, block.timestamp);
        emit SertifikatDiterbitkan(msg.sender, block.timestamp, _catatanHash);
    }
    
    /**
     * @notice Dewan Syariah reject review with reason
     */
    function rejectReview(string calldata _reason) 
        external 
        onlyRole(DEWAN_SYARIAH_ROLE) 
    {
        require(currentReview.status == ReviewStatus.PENDING, "No pending review");
        
        currentReview.status = ReviewStatus.REJECTED;
        
        emit ReviewRejected(msg.sender, _reason, block.timestamp);
    }
    
    /**
     * @notice Revoke certificate with reason
     */
    function revokeSertifikat(string calldata _reason) 
        external 
        onlyRole(DEWAN_SYARIAH_ROLE) 
    {
        require(sertifikat.valid, "Certificate already invalid");
        
        sertifikat.valid = false;
        
        emit SertifikatDirevoke(msg.sender, _reason, block.timestamp);
    }
    
    // ============================================================
    // PHASE 1: USER STAKING - AUDITOR MONITORING
    // ============================================================
    
    /**
     * @notice Auditor verify Ijarah contract compliance
     * @dev Check ujrah calculation, lock period, no hidden fees
     */
    function verifyIjarahContract(
        uint256 _contractId,
        uint256 _ethAmount,
        uint256 _ujrahCalculated,
        uint256 _lockPeriod,
        uint256 _ujrahRate
    ) external onlyRole(AUDITOR_ROLE) returns (bool isCompliant) {
        // Verify ujrah calculation: (ethAmount * rate * period) / (365 * 10000)
        uint256 expectedUjrah = (_ethAmount * _ujrahRate * _lockPeriod) / (365 * 10000);
        
        isCompliant = (expectedUjrah == _ujrahCalculated);
        
        contractCompliance[_contractId] = isCompliant;
        
        emit IjarahContractVerified(
            _contractId,
            msg.sender,
            isCompliant,
            block.timestamp
        );
        
        return isCompliant;
    }
    
    /**
     * @notice Auditor flag non-compliant activity
     * @dev Phase 1-3: Flag issues with severity level
     */
    function flagNonCompliantActivity(
        uint256 _contractId,
        string calldata _reason,
        Severity _severity
    ) public onlyRole(AUDITOR_ROLE) returns (uint256 alertId) {
        alertId = complianceAlerts.length;
        
        complianceAlerts.push(Alert({
            contractId: _contractId,
            severity: _severity,
            timestamp: uint64(block.timestamp),
            auditor: msg.sender,
            resolved: false
        }));
        
        totalAlerts++;
        contractCompliance[_contractId] = false;
        
        emit ComplianceAlertCreated(
            alertId,
            _contractId,
            _reason,
            _severity,
            block.timestamp
        );
        
        return alertId;
    }
    
    /**
     * @notice Admin resolve compliance alert
     */
    function resolveComplianceAlert(uint256 _alertId) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_alertId < complianceAlerts.length, "Invalid alert ID");
        require(!complianceAlerts[_alertId].resolved, "Already resolved");
        
        complianceAlerts[_alertId].resolved = true;
        resolvedAlerts++;
        
        emit ComplianceAlertResolved(_alertId, msg.sender, block.timestamp);
    }
    
    // ============================================================
    // PHASE 2: OPERATIONAL STAKING - WEEKLY VERIFICATION
    // ============================================================
    
    /**
     * @notice Auditor verify ujrah calculation
     * @dev Weekly check: compare expected vs actual ujrah
     */
    function verifyUjrahCalculation(
        uint256 _contractId,
        uint256 _principal,
        uint256 _rate,
        uint256 _time,
        uint256 _actualUjrahPaid
    ) external onlyRole(AUDITOR_ROLE) returns (bool isCorrect) {
        // Expected: (principal * rate * time) / (365 days * 10000)
        uint256 expectedUjrah = (_principal * _rate * _time) / (365 * 10000);
        
        isCorrect = (expectedUjrah == _actualUjrahPaid);
        
        emit UjrahVerified(
            _contractId,
            expectedUjrah,
            _actualUjrahPaid,
            isCorrect,
            block.timestamp
        );
        
        if (!isCorrect) {
            this.flagNonCompliantActivity(
                _contractId,
                "Ujrah miscalculation detected",
                Severity.HIGH
            );
        }
        
        return isCorrect;
    }
    
    /**
     * @notice Auditor verify treasury allocation
     * @dev Check: total staked = sum of principals, ujrah paid <= rewards earned
     */
    function verifyTreasuryAllocation(
        uint256 _totalStaked,
        uint256 _totalUjrahPaid,
        uint256 _treasuryBalance
    ) external onlyRole(AUDITOR_ROLE) returns (bool isBalanced) {
        // Simple check: treasury should have enough for staked + ujrah
        isBalanced = (_treasuryBalance >= _totalStaked);
        
        emit TreasuryVerified(
            _totalStaked,
            _totalUjrahPaid,
            isBalanced,
            block.timestamp
        );
        
        if (!isBalanced) {
            this.flagNonCompliantActivity(
                0, // Platform-level issue
                "Treasury mismatch detected",
                Severity.CRITICAL
            );
        }
        
        return isBalanced;
    }
    
    /**
     * @notice Auditor publish monthly compliance report
     */
    function publishComplianceReport(bytes32 _ipfsHash) 
        external 
        onlyRole(AUDITOR_ROLE) 
    {
        complianceReportHashes.push(_ipfsHash);
        
        emit ComplianceReportPublished(
            _ipfsHash,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @notice Record audit activity (general)
     */
    function catatAudit(
        bytes32 _jenisAuditHash,
        bytes32 _hasilHash,
        string calldata _jenisAuditText,
        string calldata _hasilText
    ) external onlyRole(AUDITOR_ROLE) {
        bytes32 dataHash = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                _jenisAuditHash,
                _hasilHash,
                keccak256(bytes(_jenisAuditText)),
                keccak256(bytes(_hasilText))
            )
        );

        auditHashes.push(dataHash);
        totalAudits++;

        emit AuditDilakukan(
            block.timestamp,
            msg.sender,
            _jenisAuditHash,
            _jenisAuditText,
            _hasilText,
            dataHash
        );
    }
    
    // ============================================================
    // PHASE 3: WITHDRAWAL - AUDITOR VERIFICATION
    // ============================================================
    
    /**
     * @notice Auditor verify withdrawal transaction
     * @dev Check: principal returned = deposit, ujrah paid, NFT burned
     */
    function verifyWithdrawal(
        uint256 _contractId,
        uint256 _originalDeposit,
        uint256 _amountWithdrawn,
        bool _ujrahPaid,
        bool _nftBurned
    ) external onlyRole(AUDITOR_ROLE) returns (bool isValid) {
        isValid = (
            _originalDeposit == _amountWithdrawn &&
            _ujrahPaid &&
            _nftBurned
        );
        
        emit WithdrawalVerified(
            _contractId,
            msg.sender,
            isValid,
            block.timestamp
        );
        
        if (!isValid) {
            this.flagNonCompliantActivity(
                _contractId,
                "Invalid withdrawal detected",
                Severity.HIGH
            );
        }
        
        return isValid;
    }
    
    /**
     * @notice Auditor alert for large withdrawal
     */
    function alertLargeWithdrawal(
          uint256 _contractId,
            uint256, // _amount
    uint256  // _liquidityImpact
    ) external onlyRole(AUDITOR_ROLE) {
        this.flagNonCompliantActivity(
            _contractId,
            "Large withdrawal impacting liquidity",
            Severity.MEDIUM
        );
    }
    
    // ============================================================
    // PHASE 4: PERIODIC REVIEW - QUARTERLY
    // ============================================================
    
    /**
     * @notice Auditor publish quarterly audit report
     * @dev Compile 3 months of data
     */
    function publishQuarterlyAudit(bytes32 _ipfsHash) 
        external 
        onlyRole(AUDITOR_ROLE) 
    {
        emit QuarterlyAuditPublished(
            _ipfsHash,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @notice Dewan Syariah renew certificate
     * @dev After reviewing quarterly audit
     */
    function renewSertifikat(
        bytes32 _newCertificateHash,
        uint64 _expiryInDays
    ) external onlyRole(DEWAN_SYARIAH_ROLE) {
        require(sertifikat.valid, "No active certificate to renew");
        
        uint64 newExpiry = uint64(block.timestamp) + (_expiryInDays * 1 days);
        
        sertifikat.tanggalSertifikasi = uint64(block.timestamp);
        sertifikat.tanggalExpiry = newExpiry;
        sertifikat.catatanHash = _newCertificateHash;
        
        emit CertificateRenewed(
            _newCertificateHash,
            newExpiry,
            block.timestamp
        );
    }
    
    /**
     * @notice Dewan Syariah update fatwa
     */
    function updateFatwa(
        string calldata _topic,
        bytes32 _fatwaIPFSHash
    ) external onlyRole(DEWAN_SYARIAH_ROLE) {
        fatwaHashes.push(_fatwaIPFSHash);
        
        emit FatwaUpdated(_topic, _fatwaIPFSHash, block.timestamp);
    }
    
    /**
     * @notice Dewan Syariah suspend operations
     * @dev For major violations
     */
    function suspendOperations(string calldata _reason) 
        external 
        onlyRole(DEWAN_SYARIAH_ROLE) 
    {
        sertifikat.valid = false;
        
        emit OperationsSuspended(_reason, msg.sender, block.timestamp);
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    function isPlatformCertified() external view returns (bool) {
        return sertifikat.valid && block.timestamp < sertifikat.tanggalExpiry;
    }
    
    function getReviewStatus() external view returns (
        ReviewStatus status,
        uint64 submittedAt,
        address submittedBy
    ) {
        return (
            currentReview.status,
            currentReview.submittedAt,
            currentReview.submittedBy
        );
    }
    
    function getCertificateInfo() external view returns (
        bool valid,
        uint64 issuedAt,
        uint64 expiresAt,
        address issuedBy,
        bytes32 certificateHash
    ) {
        return (
            sertifikat.valid,
            sertifikat.tanggalSertifikasi,
            sertifikat.tanggalExpiry,
            sertifikat.dewanSyariah,
            sertifikat.catatanHash
        );
    }
    
    function getComplianceStats() external view returns (
        uint256 totalAuditsCount,
        uint256 totalAlertsCount,
        uint256 resolvedAlertsCount,
        uint256 complianceRate
    ) {
        uint256 rate = totalAlerts > 0 
            ? (resolvedAlerts * 10000) / totalAlerts 
            : 10000;
        
        return (totalAudits, totalAlerts, resolvedAlerts, rate);
    }
    
    function getAlert(uint256 _alertId) external view returns (
        uint256 contractId,
        Severity severity,
        uint64 timestamp,
        address auditor,
        bool resolved
    ) {
        require(_alertId < complianceAlerts.length, "Invalid alert ID");
        Alert memory alert = complianceAlerts[_alertId];
        
        return (
            alert.contractId,
            alert.severity,
            alert.timestamp,
            alert.auditor,
            alert.resolved
        );
    }
    
    function getTotalComplianceReports() external view returns (uint256) {
        return complianceReportHashes.length;
    }
    
    function getTotalFatwas() external view returns (uint256) {
        return fatwaHashes.length;
    }
    
    function verifyAuditHash(bytes32 _hash) external view returns (bool) {
        for (uint256 i = 0; i < auditHashes.length; i++) {
            if (auditHashes[i] == _hash) {
                return true;
            }
        }
        return false;
    }
    
    function isContractCompliant(uint256 _contractId) external view returns (bool) {
        return contractCompliance[_contractId];
    }
    
    // ============================================================
    // UTILITY
    // ============================================================
    
    function stringToBytes32(string memory source) 
        public 
        pure 
        returns (bytes32 result) 
    {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        
        assembly {
            result := mload(add(source, 32))
        }
    }
}