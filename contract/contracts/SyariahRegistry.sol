// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SyariahRegistry MVP
 * @notice Registry untuk sertifikasi syariah - MVP VERSION
 * @dev Focus: ADMIN dan USER roles (Dewan Syariah & Auditor = placeholder only)
 */
contract SyariahRegistry is AccessControl {
    
    // ============ ROLES ============
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Placeholder roles (tidak bisa write/read, hanya nama)
    bytes32 public constant DEWAN_SYARIAH_ROLE = keccak256("DEWAN_SYARIAH_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    
    // ============ ENUMS ============
    
    enum ContractStatus { ACTIVE, COMPLETED, CANCELLED }
    
    // ============ STRUCTS ============
    
    /// @notice Platform Certificate (simplified)
    struct PlatformCertificate {
        bool isActive;
        uint64 activatedAt;
        string certificateURI; // IPFS link to certificate doc
    }
    
    /// @notice User Ijarah Contract
    struct IjarahContract {
        uint256 contractId;
        address user;
        uint256 principal; // ETH amount staked
        uint256 ujrahRate; // Ujrah rate in basis points (e.g., 500 = 5%)
        uint256 lockPeriod; // Lock period in days
        uint256 totalUjrah; // Total ujrah to be earned
        uint64 startTime;
        uint64 endTime;
        ContractStatus status;
        bool withdrawn;
    }
    
    // ============ STATE VARIABLES ============
    
    PlatformCertificate public platformCert;
    
    // Contract tracking
    uint256 public nextContractId;
    mapping(uint256 => IjarahContract) public contracts;
    mapping(address => uint256[]) public userContracts;
    
    // Platform stats
    uint256 public totalStaked;
    uint256 public totalUjrahPaid;
    uint256 public totalActiveContracts;
    uint256 public totalCompletedContracts;
    
    // ============ EVENTS ============
    
    // Admin events
    event PlatformCertified(
        address indexed admin,
        string certificateURI,
        uint256 timestamp
    );
    
    event PlatformSuspended(
        address indexed admin,
        string reason,
        uint256 timestamp
    );
    
    // User events
    event IjarahContractCreated(
        uint256 indexed contractId,
        address indexed user,
        uint256 principal,
        uint256 ujrahRate,
        uint256 lockPeriod,
        uint256 totalUjrah,
        uint64 startTime,
        uint64 endTime,
        uint256 timestamp
    );
    
    event UjrahClaimed(
        uint256 indexed contractId,
        address indexed user,
        uint256 ujrahAmount,
        uint256 timestamp
    );
    
    event ContractCompleted(
        uint256 indexed contractId,
        address indexed user,
        uint256 principalReturned,
        uint256 totalUjrahPaid,
        uint256 timestamp
    );
    
    event ContractCancelled(
        uint256 indexed contractId,
        address indexed user,
        string reason,
        uint256 timestamp
    );
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================
    
    /**
     * @notice Admin activate platform with certificate
     * @dev Simplified: Admin self-certifies for MVP
     */
    function activatePlatform(string calldata _certificateURI) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(!platformCert.isActive, "Platform already active");
        
        platformCert = PlatformCertificate({
            isActive: true,
            activatedAt: uint64(block.timestamp),
            certificateURI: _certificateURI
        });
        
        emit PlatformCertified(msg.sender, _certificateURI, block.timestamp);
    }
    
    /**
     * @notice Admin suspend platform operations
     */
    function suspendPlatform(string calldata _reason) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(platformCert.isActive, "Platform not active");
        
        platformCert.isActive = false;
        
        emit PlatformSuspended(msg.sender, _reason, block.timestamp);
    }
    
    /**
     * @notice Admin update certificate URI
     */
    function updateCertificate(string calldata _newCertificateURI) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        platformCert.certificateURI = _newCertificateURI;
        platformCert.activatedAt = uint64(block.timestamp);
    }
    
    /**
     * @notice Admin manually complete contract (emergency)
     */
    function adminCompleteContract(uint256 _contractId, string calldata _reason) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        IjarahContract storage c = contracts[_contractId];
        require(c.user != address(0), "Contract not found");
        require(c.status == ContractStatus.ACTIVE, "Contract not active");
        
        c.status = ContractStatus.COMPLETED;
        totalActiveContracts--;
        totalCompletedContracts++;
        
        emit ContractCancelled(_contractId, c.user, _reason, block.timestamp);
    }
    
    // ============================================================
    // USER FUNCTIONS
    // ============================================================
    
    /**
     * @notice User create Ijarah contract (stake ETH)
     * @param _ujrahRate Ujrah rate in basis points (e.g., 500 = 5% annually)
     * @param _lockPeriodDays Lock period in days
     */
    function createIjarahContract(
        uint256 _ujrahRate,
        uint256 _lockPeriodDays
    ) external payable returns (uint256 contractId) {
        require(platformCert.isActive, "Platform not active");
        require(msg.value > 0, "Must stake ETH");
        require(_lockPeriodDays >= 7, "Minimum 7 days lock");
        require(_lockPeriodDays <= 365, "Maximum 365 days lock");
        require(_ujrahRate <= 2000, "Max 20% ujrah rate");
        
        contractId = nextContractId++;
        
        // Calculate total ujrah: (principal * rate * days) / (365 * 10000)
        uint256 totalUjrah = (msg.value * _ujrahRate * _lockPeriodDays) / (365 * 10000);
        
        uint64 startTime = uint64(block.timestamp);
        uint64 endTime = startTime + uint64(_lockPeriodDays * 1 days);
        
        contracts[contractId] = IjarahContract({
            contractId: contractId,
            user: msg.sender,
            principal: msg.value,
            ujrahRate: _ujrahRate,
            lockPeriod: _lockPeriodDays,
            totalUjrah: totalUjrah,
            startTime: startTime,
            endTime: endTime,
            status: ContractStatus.ACTIVE,
            withdrawn: false
        });
        
        userContracts[msg.sender].push(contractId);
        
        totalStaked += msg.value;
        totalActiveContracts++;
        
        emit IjarahContractCreated(
            contractId,
            msg.sender,
            msg.value,
            _ujrahRate,
            _lockPeriodDays,
            totalUjrah,
            startTime,
            endTime,
            block.timestamp
        );
        
        return contractId;
    }
    
    /**
     * @notice User claim ujrah (can be called multiple times during lock period)
     * @dev Calculates pro-rata ujrah based on time elapsed
     */
    function claimUjrah(uint256 _contractId) external returns (uint256 ujrahAmount) {
        IjarahContract storage c = contracts[_contractId];
        require(c.user == msg.sender, "Not contract owner");
        require(c.status == ContractStatus.ACTIVE, "Contract not active");
        
        // Calculate earned ujrah based on time elapsed
        uint256 timeElapsed = block.timestamp - c.startTime;
        uint256 totalDuration = c.endTime - c.startTime;
        
        if (timeElapsed > totalDuration) {
            timeElapsed = totalDuration;
        }
        
        uint256 earnedUjrah = (c.totalUjrah * timeElapsed) / totalDuration;
        
        // Simple approach: track what's been paid (in real implementation, use more sophisticated tracking)
        ujrahAmount = earnedUjrah; // Simplified: pay all earned so far
        
        require(ujrahAmount > 0, "No ujrah to claim");
        
        totalUjrahPaid += ujrahAmount;
        
        // Transfer ujrah (from contract balance)
        payable(msg.sender).transfer(ujrahAmount);
        
        emit UjrahClaimed(_contractId, msg.sender, ujrahAmount, block.timestamp);
        
        return ujrahAmount;
    }
    
    /**
     * @notice User withdraw principal after lock period ends
     */
    function withdrawPrincipal(uint256 _contractId) external {
        IjarahContract storage c = contracts[_contractId];
        require(c.user == msg.sender, "Not contract owner");
        require(c.status == ContractStatus.ACTIVE, "Contract not active");
        require(block.timestamp >= c.endTime, "Lock period not ended");
        require(!c.withdrawn, "Already withdrawn");
        
        c.status = ContractStatus.COMPLETED;
        c.withdrawn = true;
        
        totalStaked -= c.principal;
        totalActiveContracts--;
        totalCompletedContracts++;
        
        // Return principal
        payable(msg.sender).transfer(c.principal);
        
        emit ContractCompleted(
            _contractId,
            msg.sender,
            c.principal,
            c.totalUjrah,
            block.timestamp
        );
    }
    
    /**
     * @notice User request early withdrawal (with penalty)
     * @dev Simplified: Admin must approve in real implementation
     */
    function requestEarlyWithdrawal(uint256 _contractId) external {
        IjarahContract storage c = contracts[_contractId];
        require(c.user == msg.sender, "Not contract owner");
        require(c.status == ContractStatus.ACTIVE, "Contract not active");
        require(!c.withdrawn, "Already withdrawn");
        
        // Early withdrawal penalty: lose 10% of principal
        uint256 penalty = c.principal / 10;
        uint256 returnAmount = c.principal - penalty;
        
        c.status = ContractStatus.CANCELLED;
        c.withdrawn = true;
        
        totalStaked -= c.principal;
        totalActiveContracts--;
        
        // Return reduced principal
        payable(msg.sender).transfer(returnAmount);
        
        emit ContractCancelled(
            _contractId,
            msg.sender,
            "Early withdrawal with penalty",
            block.timestamp
        );
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    function isPlatformActive() external view returns (bool) {
        return platformCert.isActive;
    }
    
    function getCertificateInfo() external view returns (
        bool isActive,
        uint64 activatedAt,
        string memory certificateURI
    ) {
        return (
            platformCert.isActive,
            platformCert.activatedAt,
            platformCert.certificateURI
        );
    }
    
    function getContract(uint256 _contractId) external view returns (
        address user,
        uint256 principal,
        uint256 ujrahRate,
        uint256 lockPeriod,
        uint256 totalUjrah,
        uint64 startTime,
        uint64 endTime,
        ContractStatus status,
        bool withdrawn
    ) {
        IjarahContract memory c = contracts[_contractId];
        return (
            c.user,
            c.principal,
            c.ujrahRate,
            c.lockPeriod,
            c.totalUjrah,
            c.startTime,
            c.endTime,
            c.status,
            c.withdrawn
        );
    }
    
    function getUserContracts(address _user) external view returns (uint256[] memory) {
        return userContracts[_user];
    }
    
    function getPlatformStats() external view returns (
        uint256 totalStakedAmount,
        uint256 totalUjrahPaidAmount,
        uint256 activeContracts,
        uint256 completedContracts
    ) {
        return (
            totalStaked,
            totalUjrahPaid,
            totalActiveContracts,
            totalCompletedContracts
        );
    }
    
    function calculateEarnedUjrah(uint256 _contractId) external view returns (uint256) {
        IjarahContract memory c = contracts[_contractId];
        require(c.user != address(0), "Contract not found");
        
        if (c.status != ContractStatus.ACTIVE) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - c.startTime;
        uint256 totalDuration = c.endTime - c.startTime;
        
        if (timeElapsed > totalDuration) {
            timeElapsed = totalDuration;
        }
        
        return (c.totalUjrah * timeElapsed) / totalDuration;
    }
    
    function getTimeRemaining(uint256 _contractId) external view returns (uint256) {
        IjarahContract memory c = contracts[_contractId];
        
        if (block.timestamp >= c.endTime) {
            return 0;
        }
        
        return c.endTime - block.timestamp;
    }
    
    // ============================================================
    // ADMIN TREASURY MANAGEMENT
    // ============================================================
    
    /**
     * @notice Admin deposit ETH for ujrah payments
     */
    function depositTreasury() external payable onlyRole(ADMIN_ROLE) {
        require(msg.value > 0, "Must deposit ETH");
    }
    
    /**
     * @notice Admin withdraw excess treasury (emergency)
     */
    function withdrawTreasury(uint256 _amount) external onlyRole(ADMIN_ROLE) {
        require(_amount <= address(this).balance - totalStaked, "Cannot withdraw staked funds");
        payable(msg.sender).transfer(_amount);
    }
    
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getAvailableTreasury() external view returns (uint256) {
        uint256 balance = address(this).balance;
        if (balance <= totalStaked) {
            return 0;
        }
        return balance - totalStaked;
    }
    
    // ============================================================
    // FALLBACK
    // ============================================================
    
    receive() external payable {}
}