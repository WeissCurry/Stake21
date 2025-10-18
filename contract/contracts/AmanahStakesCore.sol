// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Interface untuk NFT Contract
interface IAmanahStakesNFT {
    function mintCertificate(
        uint256 _akadId,
        address _user,
        uint256 _stakedAmount,
        uint32 _lockPeriodDays,
        uint256 _expectedReward,
        uint64 _startTime,
        uint64 _endTime,
        uint32 _ujrahRate
    ) external returns (uint256 tokenId);
    
    function burnCertificate(uint256 _tokenId) external;
    
    function getTokenIdByAkadId(uint256 _akadId) external view returns (uint256);
}

/**
 * @title AmanahStakesCore MVP with NFT Integration
 * @notice Core logic untuk platform staking syariah dengan NFT certificates
 */
contract AmanahStakesCore is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public termsHash; 
    
    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEWAN_SYARIAH_ROLE = keccak256("DEWAN_SYARIAH_ROLE");
    
    // ============ ENUMS ============
    enum AkadStatus {
        ACTIVE,
        COMPLETED,
        CANCELLED
    }
    
    // ============ STRUCTS ============
    struct AkadIjarah {
        address user;
        uint128 principal;
        uint128 ujrahAmount;
        uint64 startTime;
        uint64 endTime;
        uint32 lockPeriodDays;
        uint32 ujrahRate;
        AkadStatus status;
        bool ujrahClaimed;
        uint256 nftTokenId;          // ← NEW: NFT token ID
    }
    
    struct PlatformConfig {
        uint128 minStake;
        uint128 maxStake;
        uint32 ujrahRateBps;
        uint32 minLockDays;
        uint32 maxLockDays;
        uint32 earlyWithdrawalPenaltyBps;
        bool isActive;
    }
    
    // ============ STATE VARIABLES ============
    PlatformConfig public config;
    
    // ← NEW: NFT Contract Reference
    IAmanahStakesNFT public nftContract;
    bool public nftEnabled;
    
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
    event NFTContractSet(address indexed nftContract, uint256 timestamp);
    event NFTFeatureToggled(bool enabled, uint256 timestamp);
    
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
        uint256 nftTokenId,         // ← NEW
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
    error NFTContractNotSet();
    
    // ============ CONSTRUCTOR ============
    constructor(bytes32 _initialTermsHash) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(ADMIN_ROLE, msg.sender);

    config = PlatformConfig({
        minStake: uint128(0.01 ether),
        maxStake: uint128(32 ether),
        ujrahRateBps: 400,
        minLockDays: 7,
        maxLockDays: 365,
        earlyWithdrawalPenaltyBps: 1000,
        isActive: true // langsung aktif
    });

    termsHash = _initialTermsHash; 
}

    
    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================
    
    /**
     * @notice Set NFT contract address
     */
    function setNFTContract(address _nftContractAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_nftContractAddress != address(0), "Invalid address");
        nftContract = IAmanahStakesNFT(_nftContractAddress);
        emit NFTContractSet(_nftContractAddress, block.timestamp);
    }
    
    /**
     * @notice Toggle NFT feature on/off
     */
    function toggleNFTFeature(bool _enabled) external onlyRole(ADMIN_ROLE) {
        if (_enabled && address(nftContract) == address(0)) {
            revert NFTContractNotSet();
        }
        nftEnabled = _enabled;
        emit NFTFeatureToggled(_enabled, block.timestamp);
    }
    
    function activatePlatform() external onlyRole(ADMIN_ROLE) {
        if (config.isActive) revert PlatformAlreadyActive();
        config.isActive = true;
        _unpause();
        emit PlatformActivated(msg.sender, block.timestamp);
    }
    
    function deactivatePlatform() external onlyRole(ADMIN_ROLE) {
        config.isActive = false;
        _pause();
        emit PlatformDeactivated(msg.sender, block.timestamp);
    }
    
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
        require(_ujrahRateBps <= 2000, "Ujrah rate too high");
        require(_penaltyBps <= 5000, "Penalty too high");
        
        config.minStake = _minStake;
        config.maxStake = _maxStake;
        config.ujrahRateBps = _ujrahRateBps;
        config.minLockDays = _minLockDays;
        config.maxLockDays = _maxLockDays;
        config.earlyWithdrawalPenaltyBps = _penaltyBps;
        
        emit ConfigUpdated(_minStake, _maxStake, _ujrahRateBps, block.timestamp);
    }
    
    function updateTermsHash(bytes32 _newTermsHash) external onlyRole(ADMIN_ROLE) {
        currentTermsHash = _newTermsHash;
        emit TermsUpdated(_newTermsHash, block.timestamp);
    }
    
    function depositTreasury() external payable onlyRole(ADMIN_ROLE) {
        require(msg.value > 0, "Must deposit ETH");
        emit TreasuryDeposit(msg.sender, msg.value, block.timestamp);
    }
    
    function withdrawExcess(uint256 _amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 available = getAvailableBalance();
        require(_amount <= available, "Insufficient available balance");
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        if (!success) revert TransferFailed();
    }
    
    function forceCompleteAkad(uint256 _akadId, string calldata _reason) 
        external 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        AkadIjarah storage akad = akads[_akadId];
        if (akad.user == address(0)) revert InvalidAkadId();
        if (akad.status != AkadStatus.ACTIVE) revert AkadNotActive();
        
        uint256 returnAmount = akad.principal;
        akad.status = AkadStatus.COMPLETED;
        totalStaked -= akad.principal;
        totalActiveAkads--;
        totalCompletedAkads++;
        
        // ← NEW: Burn NFT if exists
        if (nftEnabled && akad.nftTokenId != 0) {
            nftContract.burnCertificate(akad.nftTokenId);
            akad.nftTokenId = 0;
        }
        
        (bool success, ) = payable(akad.user).call{value: returnAmount}("");
        if (!success) revert TransferFailed();
        
        emit AkadForceCompleted(_akadId, akad.user, _reason, block.timestamp);
    }
    
    // ============================================================
    // USER FUNCTIONS
    // ============================================================
    
    function agreeToTerms(bytes32 _termsHash) external {
        if (_termsHash != currentTermsHash) revert InvalidTermsHash();
        hasAgreedToTerms[msg.sender] = true;
        emit TermsAgreed(msg.sender, _termsHash, block.timestamp);
    }
    
    /**
     * @notice Create Akad with NFT minting
     */
    function createAkad(uint32 _lockPeriodDays) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        returns (uint256 akadId) 
    {
        if (!hasAgreedToTerms[msg.sender]) revert TermsNotAgreed();
        if (msg.value < config.minStake || msg.value > config.maxStake) {
            revert InvalidAmount();
        }
        if (_lockPeriodDays < config.minLockDays || _lockPeriodDays > config.maxLockDays) {
            revert InvalidLockPeriod();
        }
        
        akadId = nextAkadId++;
        
        uint256 ujrahAmount = (msg.value * config.ujrahRateBps * _lockPeriodDays) / (365 * 10000);
        uint64 startTime = uint64(block.timestamp);
        uint64 endTime = startTime + uint64(_lockPeriodDays * 1 days);
        
        // ← NEW: Mint NFT if enabled
        uint256 nftTokenId = 0;
        if (nftEnabled) {
            nftTokenId = nftContract.mintCertificate(
                akadId,
                msg.sender,
                msg.value,
                _lockPeriodDays,
                ujrahAmount,
                startTime,
                endTime,
                config.ujrahRateBps
            );
        }
        
        akads[akadId] = AkadIjarah({
            user: msg.sender,
            principal: uint128(msg.value),
            ujrahAmount: uint128(ujrahAmount),
            startTime: startTime,
            endTime: endTime,
            lockPeriodDays: _lockPeriodDays,
            ujrahRate: config.ujrahRateBps,
            status: AkadStatus.ACTIVE,
            ujrahClaimed: false,
            nftTokenId: nftTokenId              // ← NEW
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
            nftTokenId,                        // ← NEW
            block.timestamp
        );
        
        return akadId;
    }
    
    function claimUjrah(uint256 _akadId) 
        external 
        nonReentrant 
        returns (uint256 claimedAmount) 
    {
        AkadIjarah storage akad = akads[_akadId];
        
        if (akad.user != msg.sender) revert NotAkadOwner();
        if (akad.status != AkadStatus.ACTIVE) revert AkadNotActive();
        if (akad.ujrahClaimed) revert UjrahAlreadyClaimed();
        
        uint256 timeElapsed = block.timestamp >= akad.endTime 
            ? akad.endTime - akad.startTime 
            : block.timestamp - akad.startTime;
        
        uint256 totalDuration = akad.endTime - akad.startTime;
        claimedAmount = (akad.ujrahAmount * timeElapsed) / totalDuration;
        
        require(claimedAmount > 0, "No ujrah to claim");
        require(address(this).balance >= claimedAmount, "Insufficient treasury balance");
        
        akad.ujrahClaimed = true;
        totalUjrahPaid += uint128(claimedAmount);
        
        (bool success, ) = payable(msg.sender).call{value: claimedAmount}("");
        if (!success) revert TransferFailed();
        
        emit UjrahClaimed(_akadId, msg.sender, claimedAmount, block.timestamp);
        
        return claimedAmount;
    }
    
    function withdrawPrincipal(uint256 _akadId) external nonReentrant {
        AkadIjarah storage akad = akads[_akadId];
        
        if (akad.user != msg.sender) revert NotAkadOwner();
        if (akad.status != AkadStatus.ACTIVE) revert AkadNotActive();
        if (block.timestamp < akad.endTime) revert LockPeriodNotEnded();
        
        uint256 returnAmount = akad.principal;
        
        akad.status = AkadStatus.COMPLETED;
        totalStaked -= akad.principal;
        totalActiveAkads--;
        totalCompletedAkads++;
        
        // ← NEW: Burn NFT if exists
        if (nftEnabled && akad.nftTokenId != 0) {
            nftContract.burnCertificate(akad.nftTokenId);
            akad.nftTokenId = 0;
        }
        
        (bool success, ) = payable(msg.sender).call{value: returnAmount}("");
        if (!success) revert TransferFailed();
        
        emit PrincipalWithdrawn(_akadId, msg.sender, returnAmount, block.timestamp);
    }
    
    function earlyWithdrawal(uint256 _akadId) external nonReentrant {
        AkadIjarah storage akad = akads[_akadId];
        
        if (akad.user != msg.sender) revert NotAkadOwner();
        if (akad.status != AkadStatus.ACTIVE) revert AkadNotActive();
        
        uint256 penalty = (akad.principal * config.earlyWithdrawalPenaltyBps) / 10000;
        uint256 returnAmount = akad.principal - penalty;
        
        akad.status = AkadStatus.CANCELLED;
        totalStaked -= akad.principal;
        totalActiveAkads--;
        
        // ← NEW: Burn NFT if exists
        if (nftEnabled && akad.nftTokenId != 0) {
            nftContract.burnCertificate(akad.nftTokenId);
            akad.nftTokenId = 0;
        }
        
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
        bool ujrahClaimed,
        uint256 nftTokenId                    // ← NEW
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
            akad.ujrahClaimed,
            akad.nftTokenId                   // ← NEW
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
        bool isPaused,
        bool _nftEnabled                      // ← NEW
    ) {
        return (
            totalStaked,
            totalUjrahPaid,
            totalActiveAkads,
            totalCompletedAkads,
            nextAkadId,
            config.isActive,
            paused(),
            nftEnabled                        // ← NEW
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
    
    // ← NEW: Get NFT info
    function getAkadNFT(uint256 _akadId) external view returns (uint256 nftTokenId) {
        return akads[_akadId].nftTokenId;
    }
    
    function isNFTEnabled() external view returns (bool) {
        return nftEnabled;
    }
    
    function getNFTContract() external view returns (address) {
        return address(nftContract);
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