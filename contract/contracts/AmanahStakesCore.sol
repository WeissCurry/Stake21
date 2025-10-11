// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AmanahStakesCore MVP
 * @notice Core logic untuk platform staking syariah - MVP VERSION
 * @dev Focus: ADMIN dan USER roles only (Dewan Syariah = placeholder)
 */
contract AmanahStakesCore is AccessControl, ReentrancyGuard, Pausable {
    
    // ============ ROLES ============
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Placeholder role (tidak bisa write/read, hanya nama)
    bytes32 public constant DEWAN_SYARIAH_ROLE = keccak256("DEWAN_SYARIAH_ROLE");
    
    // ============ ENUMS ============
    
    enum AkadStatus {
        ACTIVE,      // Sedang staking
        COMPLETED,   // Selesai & withdrawn
        CANCELLED    // Dibatalkan (early withdrawal)
    }
    
    // ============ STRUCTS ============
    
    /// @notice Akad Ijarah (Simplified & Optimized)
    struct AkadIjarah {
        address user;              // User address
        uint128 principal;         // ETH amount staked
        uint128 ujrahAmount;       // Total ujrah earned
        uint64 startTime;          // Start timestamp
        uint64 endTime;            // End timestamp (lockup)
        uint32 lockPeriodDays;     // Lock period in days
        uint32 ujrahRate;          // Ujrah rate in basis points (e.g., 400 = 4%)
        AkadStatus status;         // Current status
        bool ujrahClaimed;         // Whether ujrah has been claimed
    }
    
    /// @notice Platform Configuration
    struct PlatformConfig {
        uint128 minStake;          // Minimum stake amount
        uint128 maxStake;          // Maximum stake amount
        uint32 ujrahRateBps;       // Default ujrah rate (basis points)
        uint32 minLockDays;        // Minimum lock period
        uint32 maxLockDays;        // Maximum lock period
        uint32 earlyWithdrawalPenaltyBps; // Penalty for early withdrawal (basis points)
        bool isActive;             // Platform active status
    }
    
    // ============ STATE VARIABLES ============
    
    PlatformConfig public config;
    
    // Akad tracking
    uint256 public nextAkadId;
    mapping(uint256 => AkadIjarah) public akads;
    mapping(address => uint256[]) public userAkads;
    
    // Platform statistics
    uint128 public totalStaked;
    uint128 public totalUjrahPaid;
    uint256 public totalActiveAkads;
    uint256 public totalCompletedAkads;
    
    // Terms agreement
    bytes32 public currentTermsHash;
    mapping(address => bool) public hasAgreedToTerms;
    
    // ============ EVENTS ============
    
    // Admin events
    event PlatformActivated(address indexed admin, uint256 timestamp);
    event PlatformDeactivated(address indexed admin, uint256 timestamp);
    event ConfigUpdated(
        uint256 minStake,
        uint256 maxStake,
        uint256 ujrahRate,
        uint256 timestamp
    );
    event TermsUpdated(bytes32 indexed newTermsHash, uint256 timestamp);
    
    // User events
    event TermsAgreed(
        address indexed user,
        bytes32 indexed termsHash,
        uint256 timestamp
    );
    
    event AkadCreated(
        uint256 indexed akadId,
        address indexed user,
        uint256 principal,
        uint256 ujrahAmount,
        uint32 lockPeriodDays,
        uint64 startTime,
        uint64 endTime,
        uint256 timestamp
    );
    
    event UjrahClaimed(
        uint256 indexed akadId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event PrincipalWithdrawn(
        uint256 indexed akadId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event EarlyWithdrawal(
        uint256 indexed akadId,
        address indexed user,
        uint256 principalReturned,
        uint256 penalty,
        uint256 timestamp
    );
    
    event TreasuryDeposit(
        address indexed admin,
        uint256 amount,
        uint256 timestamp
    );

    event AkadForceCompleted(
        uint256 indexed akadId,
        address indexed user,
        string reason,
        uint256 timestamp
    );
    
    // ============ ERRORS ============
    
    error PlatformNotActive();
    error PlatformAlreadyActive();
    error TermsNotAgreed();
    error InvalidTermsHash();
    error InvalidAmount();
    error InvalidLockPeriod();
    error InvalidAkadId();
    error NotAkadOwner();
    error AkadNotActive();
    error LockPeriodNotEnded();
    error UjrahAlreadyClaimed();
    error TransferFailed();
    error InsufficientBalance();
    
    // ============ CONSTRUCTOR ============
    
    constructor(bytes32 _initialTermsHash) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Default configuration
        config = PlatformConfig({
            minStake: uint128(0.01 ether),
            maxStake: uint128(32 ether),
            ujrahRateBps: 400,                      // 4% annually
            minLockDays: 7,                         // 7 days minimum
            maxLockDays: 365,                       // 1 year maximum
            earlyWithdrawalPenaltyBps: 1000,        // 10% penalty
            isActive: false
        });
        
        currentTermsHash = _initialTermsHash;
        
        // Start paused for safety
        _pause();
    }
    
    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================
    
    /**
     * @notice Admin activate platform
     * @dev Unpause and set platform as active
     */
    function activatePlatform() external onlyRole(ADMIN_ROLE) {
        if (config.isActive) revert PlatformAlreadyActive();
        
        config.isActive = true;
        _unpause();
        
        emit PlatformActivated(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Admin deactivate platform (emergency)
     */
    function deactivatePlatform() external onlyRole(ADMIN_ROLE) {
        config.isActive = false;
        _pause();
        
        emit PlatformDeactivated(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Admin update platform configuration
     */
    function updateConfig(
        uint128 _minStake,
        uint128 _maxStake,
        uint32 _ujrahRateBps,
        uint32 _minLockDays,
        uint32 _maxLockDays,
        uint32 _penaltyBps
    ) external onlyRole(ADMIN_ROLE) {
        require(_minStake < _maxStake, "Invalid stake limits");
        require(_minLockDays < _maxLockDays, "Invalid lock period limits");
        require(_ujrahRateBps <= 2000, "Ujrah rate too high"); // Max 20%
        require(_penaltyBps <= 5000, "Penalty too high"); // Max 50%
        
        config.minStake = _minStake;
        config.maxStake = _maxStake;
        config.ujrahRateBps = _ujrahRateBps;
        config.minLockDays = _minLockDays;
        config.maxLockDays = _maxLockDays;
        config.earlyWithdrawalPenaltyBps = _penaltyBps;
        
        emit ConfigUpdated(_minStake, _maxStake, _ujrahRateBps, block.timestamp);
    }
    
    /**
     * @notice Admin update Ijarah terms hash
     */
    function updateTermsHash(bytes32 _newTermsHash) external onlyRole(ADMIN_ROLE) {
        currentTermsHash = _newTermsHash;
        emit TermsUpdated(_newTermsHash, block.timestamp);
    }
    
    /**
     * @notice Admin deposit ETH to treasury for ujrah payments
     */
    function depositTreasury() external payable onlyRole(ADMIN_ROLE) {
        require(msg.value > 0, "Must deposit ETH");
        emit TreasuryDeposit(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @notice Admin withdraw excess funds (emergency)
     */
    function withdrawExcess(uint256 _amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 available = getAvailableBalance();
        require(_amount <= available, "Insufficient available balance");
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @notice Admin force complete akad (emergency only)
     */
    function forceCompleteAkad(uint256 _akadId, string calldata _reason) 
        external 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        AkadIjarah storage akad = akads[_akadId];
        if (akad.user == address(0)) revert InvalidAkadId();
        if (akad.status != AkadStatus.ACTIVE) revert AkadNotActive();
        
        // Return principal to user
        uint256 returnAmount = akad.principal;
        akad.status = AkadStatus.COMPLETED;
        totalStaked -= akad.principal;
        totalActiveAkads--;
        totalCompletedAkads++;
        
        (bool success, ) = payable(akad.user).call{value: returnAmount}("");
        if (!success) revert TransferFailed();
        
         emit AkadForceCompleted(_akadId, akad.user, _reason, block.timestamp);
    }
    
    // ============================================================
    // USER FUNCTIONS
    // ============================================================
    
    /**
     * @notice User agree to Ijarah terms
     * @dev Must be called before creating akad
     */
    function agreeToTerms(bytes32 _termsHash) external {
        if (_termsHash != currentTermsHash) revert InvalidTermsHash();
        
        hasAgreedToTerms[msg.sender] = true;
        
        emit TermsAgreed(msg.sender, _termsHash, block.timestamp);
    }
    
    /**
     * @notice User create Akad Ijarah (stake ETH)
     * @param _lockPeriodDays Lock period in days
     * @return akadId The created akad ID
     */
    function createAkad(uint32 _lockPeriodDays) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        returns (uint256 akadId) 
    {
        // Validations
        if (!config.isActive) revert PlatformNotActive();
        if (!hasAgreedToTerms[msg.sender]) revert TermsNotAgreed();
        if (msg.value < config.minStake || msg.value > config.maxStake) {
            revert InvalidAmount();
        }
        if (_lockPeriodDays < config.minLockDays || _lockPeriodDays > config.maxLockDays) {
            revert InvalidLockPeriod();
        }
        
        akadId = nextAkadId++;
        
        // Calculate ujrah: (principal * rate * days) / (365 * 10000)
        uint256 ujrahAmount = (msg.value * config.ujrahRateBps * _lockPeriodDays) / (365 * 10000);
        
        uint64 startTime = uint64(block.timestamp);
        uint64 endTime = startTime + uint64(_lockPeriodDays * 1 days);
        
        // Create akad
        akads[akadId] = AkadIjarah({
            user: msg.sender,
            principal: uint128(msg.value),
            ujrahAmount: uint128(ujrahAmount),
            startTime: startTime,
            endTime: endTime,
            lockPeriodDays: _lockPeriodDays,
            ujrahRate: config.ujrahRateBps,
            status: AkadStatus.ACTIVE,
            ujrahClaimed: false
        });
        
        userAkads[msg.sender].push(akadId);
        
        totalStaked += uint128(msg.value);
        totalActiveAkads++;
        
        emit AkadCreated(
            akadId,
            msg.sender,
            msg.value,
            ujrahAmount,
            _lockPeriodDays,
            startTime,
            endTime,
            block.timestamp
        );
        
        return akadId;
    }
    
    /**
     * @notice User claim ujrah (can be claimed anytime, calculated pro-rata)
     * @param _akadId The akad ID to claim from
     * @return claimedAmount Amount of ujrah claimed
     */
    function claimUjrah(uint256 _akadId) 
        external 
        nonReentrant 
        returns (uint256 claimedAmount) 
    {
        AkadIjarah storage akad = akads[_akadId];
        
        // Validations
        if (akad.user != msg.sender) revert NotAkadOwner();
        if (akad.status != AkadStatus.ACTIVE) revert AkadNotActive();
        if (akad.ujrahClaimed) revert UjrahAlreadyClaimed();
        
        // Calculate earned ujrah (pro-rata based on time)
        uint256 timeElapsed = block.timestamp >= akad.endTime 
            ? akad.endTime - akad.startTime 
            : block.timestamp - akad.startTime;
        
        uint256 totalDuration = akad.endTime - akad.startTime;
        claimedAmount = (akad.ujrahAmount * timeElapsed) / totalDuration;
        
        require(claimedAmount > 0, "No ujrah to claim");
        require(address(this).balance >= claimedAmount, "Insufficient treasury balance");
        
        // Mark as claimed (simplified - in production, track partial claims)
        akad.ujrahClaimed = true;
        totalUjrahPaid += uint128(claimedAmount);
        
        // Transfer ujrah to user
        (bool success, ) = payable(msg.sender).call{value: claimedAmount}("");
        if (!success) revert TransferFailed();
        
        emit UjrahClaimed(_akadId, msg.sender, claimedAmount, block.timestamp);
        
        return claimedAmount;
    }
    
    /**
     * @notice User withdraw principal after lock period ends
     * @param _akadId The akad ID to withdraw from
     */
    function withdrawPrincipal(uint256 _akadId) external nonReentrant {
        AkadIjarah storage akad = akads[_akadId];
        
        // Validations
        if (akad.user != msg.sender) revert NotAkadOwner();
        if (akad.status != AkadStatus.ACTIVE) revert AkadNotActive();
        if (block.timestamp < akad.endTime) revert LockPeriodNotEnded();
        
        uint256 returnAmount = akad.principal;
        
        // Update state
        akad.status = AkadStatus.COMPLETED;
        totalStaked -= akad.principal;
        totalActiveAkads--;
        totalCompletedAkads++;
        
        // Transfer principal back to user
        (bool success, ) = payable(msg.sender).call{value: returnAmount}("");
        if (!success) revert TransferFailed();
        
        emit PrincipalWithdrawn(_akadId, msg.sender, returnAmount, block.timestamp);
    }
    
    /**
     * @notice User request early withdrawal (with penalty)
     * @param _akadId The akad ID to withdraw from
     */
    function earlyWithdrawal(uint256 _akadId) external nonReentrant {
        AkadIjarah storage akad = akads[_akadId];
        
        // Validations
        if (akad.user != msg.sender) revert NotAkadOwner();
        if (akad.status != AkadStatus.ACTIVE) revert AkadNotActive();
        
        // Calculate penalty and return amount
        uint256 penalty = (akad.principal * config.earlyWithdrawalPenaltyBps) / 10000;
        uint256 returnAmount = akad.principal - penalty;
        
        // Update state
        akad.status = AkadStatus.CANCELLED;
        totalStaked -= akad.principal;
        totalActiveAkads--;
        
        // Transfer reduced principal to user
        (bool success, ) = payable(msg.sender).call{value: returnAmount}("");
        if (!success) revert TransferFailed();
        
        emit EarlyWithdrawal(
            _akadId,
            msg.sender,
            returnAmount,
            penalty,
            block.timestamp
        );
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    function getAkad(uint256 _akadId) external view returns (
        address user,
        uint256 principal,
        uint256 ujrahAmount,
        uint64 startTime,
        uint64 endTime,
        uint32 lockPeriodDays,
        uint32 ujrahRate,
        AkadStatus status,
        bool ujrahClaimed
    ) {
        AkadIjarah memory akad = akads[_akadId];
        return (
            akad.user,
            akad.principal,
            akad.ujrahAmount,
            akad.startTime,
            akad.endTime,
            akad.lockPeriodDays,
            akad.ujrahRate,
            akad.status,
            akad.ujrahClaimed
        );
    }
    
    function getUserAkads(address _user) external view returns (uint256[] memory) {
        return userAkads[_user];
    }
    
    function getPlatformStats() external view returns (
        uint256 totalStakedAmount,
        uint256 totalUjrahPaidAmount,
        uint256 activeAkads,
        uint256 completedAkads,
        uint256 totalAkads,
        bool isActive,
        bool isPaused
    ) {
        return (
            totalStaked,
            totalUjrahPaid,
            totalActiveAkads,
            totalCompletedAkads,
            nextAkadId,
            config.isActive,
            paused()
        );
    }
    
    function getConfig() external view returns (
        uint256 minStake,
        uint256 maxStake,
        uint256 ujrahRateBps,
        uint256 minLockDays,
        uint256 maxLockDays,
        uint256 penaltyBps,
        bool isActive
    ) {
        return (
            config.minStake,
            config.maxStake,
            config.ujrahRateBps,
            config.minLockDays,
            config.maxLockDays,
            config.earlyWithdrawalPenaltyBps,
            config.isActive
        );
    }
    
    function calculateUjrah(uint256 _principal, uint32 _lockDays) 
        external 
        view 
        returns (uint256) 
    {
        return (_principal * config.ujrahRateBps * _lockDays) / (365 * 10000);
    }
    
    function calculateEarnedUjrah(uint256 _akadId) 
        external 
        view 
        returns (uint256) 
    {
        AkadIjarah memory akad = akads[_akadId];
        if (akad.status != AkadStatus.ACTIVE) return 0;
        
        uint256 timeElapsed = block.timestamp >= akad.endTime 
            ? akad.endTime - akad.startTime 
            : block.timestamp - akad.startTime;
        
        uint256 totalDuration = akad.endTime - akad.startTime;
        return (akad.ujrahAmount * timeElapsed) / totalDuration;
    }
    
    function getTimeRemaining(uint256 _akadId) external view returns (uint256) {
        AkadIjarah memory akad = akads[_akadId];
        if (block.timestamp >= akad.endTime) return 0;
        return akad.endTime - block.timestamp;
    }
    
    function hasUserAgreed(address _user) external view returns (bool) {
        return hasAgreedToTerms[_user];
    }
    
    function getCurrentTerms() external view returns (bytes32) {
        return currentTermsHash;
    }
    
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getAvailableBalance() public view returns (uint256) {
        uint256 balance = address(this).balance;
        if (balance <= totalStaked) return 0;
        return balance - totalStaked;
    }
    
    function calculateEarlyWithdrawalPenalty(uint256 _akadId) 
        external 
        view 
        returns (uint256 penalty, uint256 returnAmount) 
    {
        AkadIjarah memory akad = akads[_akadId];
        penalty = (akad.principal * config.earlyWithdrawalPenaltyBps) / 10000;
        returnAmount = akad.principal - penalty;
        return (penalty, returnAmount);
    }
    
    // ============================================================
    // RECEIVE & FALLBACK
    // ============================================================
    
    receive() external payable {
        // Accept ETH deposits for treasury
    }
    
    fallback() external payable {
        revert("Invalid call");
    }
}