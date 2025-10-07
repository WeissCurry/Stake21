// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./AmanahStakesToken.sol";
import "./SyariahRegistry.sol";
import "./AmanahStakesTreasury.sol";
import "./libraries/LibUjrah.sol";

/**
 * @title AmanahStakesCore
 * @notice Core logic untuk platform staking syariah - COMPLETE VERSION
 * @dev Implements all phases: Certification, Staking, Operations, Withdrawal, Review
 */
contract AmanahStakesCore is AccessControl, ReentrancyGuard, Pausable {
    
    using LibUjrah for uint256;
    
    // ============ ROLES (SIMPLIFIED) ============
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEWAN_SYARIAH_ROLE = keccak256("DEWAN_SYARIAH_ROLE");
    
    // ============ STRUCTS (PACKED) ============
    
    enum StatusAkad {
        DRAFT,              // 0 - Belum approve
        AKTIF,              // 1 - Approved, belum staking
        STAKING,            // 2 - Sedang staking
        MENUNGGU_PENARIKAN, // 3 - User request withdrawal
        SELESAI,            // 4 - Completed
        DIBATALKAN          // 5 - Cancelled
    }
    
    /// @notice Akad Ijarah (Optimized packing)
    struct AkadIjarah {
        address mujir;              // 20 bytes
        uint128 ethAmount;          // 16 bytes
        uint128 ujrahTetap;         // 16 bytes
        uint64 periodeAwal;         // 8 bytes
        uint64 periodeAkhir;        // 8 bytes
        uint64 timestampDeposit;    // 8 bytes
        uint64 timestampPenarikan;  // 8 bytes
        uint32 tokenId;             // 4 bytes
        StatusAkad status;          // 1 byte
        bool ujrahDibayar;          // 1 byte
        bool termsAgreed;           // 1 byte - NEW
    }
    
    /// @notice Protocol Config (Packed)
    struct ProtocolConfig {
        uint128 minStake;           // 16 bytes
        uint128 maxStake;           // 16 bytes
        uint32 ujrahBasisPoints;    // 4 bytes (e.g., 400 = 4%)
        uint32 periodeLockupDays;   // 4 bytes
        bool protokolAktif;         // 1 byte
    }
    
    // ============ STATE VARIABLES ============
    
    AmanahStakesToken public immutable token;
    SyariahRegistry public immutable registry;
    AmanahStakesTreasury public immutable treasury;
    
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => AkadIjarah) public akads;
    mapping(address => uint256[]) public userAkads;
    mapping(address => bool) public hasAgreedToTerms; // NEW: Phase 1
    
    ProtocolConfig public config;
    bytes32 public currentTermsHash; // NEW: Current Ijarah terms
    
    // Statistics (packed)
    uint128 public totalETHStaked;
    uint128 public totalUjrahDibayar;
    uint256 public totalRewardsHarvested; // NEW: Phase 2
    
    // ============ EVENTS ============
    
    // Phase 0: Deployment
    event ContractDeployed(address indexed admin, uint256 timestamp);
    
    // Phase 1: User Staking
    event IjarahAgreementSigned(
        address indexed user,
        bytes32 indexed termsHash,
        uint256 timestamp
    );
    
    event AkadCreated(
        uint256 indexed tokenId,
        address indexed mujir,
        uint256 ethAmount,
        uint256 ujrahTetap,
        uint256 periodeAkhir
    );
    
    event AkadApproved(uint256 indexed tokenId, address indexed approver);
    event StakingStarted(uint256 indexed tokenId);
    
    // Phase 2: Operations
    event RewardsHarvested(uint256 amount, uint256 timestamp);
    event UjrahDistributed(
        uint256 indexed tokenId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    // Phase 3: Withdrawal
    event WithdrawalRequested(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 timestamp
    );
    
    event WithdrawalCompleted(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 timestamp
    );
    
    event AkadNFTBurned(uint256 indexed tokenId, uint256 timestamp);
    
    // Config
    event ConfigUpdated(uint256 minStake, uint256 maxStake, uint256 ujrahBp);
    event TermsHashUpdated(bytes32 indexed newTermsHash, uint256 timestamp);
    event ProtocolToggled(bool isActive, uint256 timestamp);
    
    // ============ ERRORS ============
    
    error NotCertified();
    error ProtocolInactive();
    error InvalidAmount();
    error InvalidPeriod();
    error InvalidStatus();
    error NotOwner();
    error PeriodNotEnded();
    error UjrahNotPaid();
    error TransferFailed();
    error TermsNotAgreed();
    error InvalidTermsHash();
    error AlreadyPaid();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _token,
        address _registry,
        address payable _treasury,
        bytes32 _initialTermsHash
    ) {
        require(_token != address(0), "Invalid token");
        require(_registry != address(0), "Invalid registry");
        require(_treasury != address(0), "Invalid treasury");
        
        token = AmanahStakesToken(_token);
        registry = SyariahRegistry(_registry);
        treasury = AmanahStakesTreasury(_treasury);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Default config
        config = ProtocolConfig({
            minStake: uint128(0.01 ether),
            maxStake: uint128(32 ether),
            ujrahBasisPoints: 400,      // 4%
            periodeLockupDays: 30,
            protokolAktif: false        // Start PAUSED
        });
        
        currentTermsHash = _initialTermsHash;
        
        // Start in PAUSED state
        _pause();
        
        emit ContractDeployed(msg.sender, block.timestamp);
    }
    
    // ============================================================
    // PHASE 0: DEPLOYMENT & CERTIFICATION
    // ============================================================
    
    /**
     * @notice Admin unpause contract after Syariah certification
     * @dev Can only unpause if platform is certified
     */
    function unpauseContract() external onlyRole(ADMIN_ROLE) {
        require(registry.isPlatformCertified(), "Platform not certified");
        _unpause();
    }
    
    /**
     * @notice Admin pause contract (emergency)
     */
    function pauseContract() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Update Ijarah terms hash
     */
    function setTermsHash(bytes32 _termsHash) external onlyRole(ADMIN_ROLE) {
        currentTermsHash = _termsHash;
        emit TermsHashUpdated(_termsHash, block.timestamp);
    }
    
    // ============================================================
    // PHASE 1: USER STAKING
    // ============================================================
    
    /**
     * @notice User agrees to Ijarah terms
     * @dev Must be called before staking
     */
    function agreeToIjarahTerms(bytes32 _termsHash) external {
        if (_termsHash != currentTermsHash) revert InvalidTermsHash();
        
        hasAgreedToTerms[msg.sender] = true;
        
        emit IjarahAgreementSigned(msg.sender, _termsHash, block.timestamp);
    }
    
    /**
     * @notice User creates Akad Ijarah & deposits ETH
     * @dev Mints NFT as proof of akad
     */
    function buatAkad(uint256 _periodeHari) 
        external 
        payable 
        nonReentrant 
        whenNotPaused
        returns (uint256)
    {
        // Phase 1 Validations
        if (!registry.isPlatformCertified()) revert NotCertified();
        if (!config.protokolAktif) revert ProtocolInactive();
        if (!hasAgreedToTerms[msg.sender]) revert TermsNotAgreed();
        if (!LibUjrah.validateStakeParams(
            msg.value,
            config.minStake,
            config.maxStake,
            _periodeHari
        )) revert InvalidAmount();
        
        uint256 tokenId = _tokenIdCounter++;
        uint256 ujrahTetap = LibUjrah.hitungUjrah(
            msg.value,
            config.ujrahBasisPoints,
            _periodeHari
        );
        
        // Create akad (packed storage)
        akads[tokenId] = AkadIjarah({
            mujir: msg.sender,
            ethAmount: uint128(msg.value),
            ujrahTetap: uint128(ujrahTetap),
            periodeAwal: uint64(block.timestamp),
            periodeAkhir: uint64(block.timestamp + (_periodeHari * 1 days)),
            timestampDeposit: 0,
            timestampPenarikan: 0,
            tokenId: uint32(tokenId),
            status: StatusAkad.DRAFT,
            ujrahDibayar: false,
            termsAgreed: true
        });
        
        userAkads[msg.sender].push(tokenId);
        
        // Mint SBT (Soul Bound Token) as akad proof
        token.mint(msg.sender, tokenId);
        
        emit AkadCreated(
            tokenId,
            msg.sender,
            msg.value,
            ujrahTetap,
            block.timestamp + (_periodeHari * 1 days)
        );
        
        return tokenId;
    }
    
    /**
     * @notice Dewan Syariah approve akad
     * @dev After verifying akad compliance
     */
    function approveAkad(uint256 _tokenId) 
        external 
        onlyRole(DEWAN_SYARIAH_ROLE) 
    {
        AkadIjarah storage akad = akads[_tokenId];
        if (akad.status != StatusAkad.DRAFT) revert InvalidStatus();
        
        akad.status = StatusAkad.AKTIF;
        akad.timestampDeposit = uint64(block.timestamp);
        
        emit AkadApproved(_tokenId, msg.sender);
    }
    
    /**
     * @notice Dewan Syariah approve multiple akads (batch)
     */
    function approveAkadBatch(uint256[] calldata _tokenIds) 
        external 
        onlyRole(DEWAN_SYARIAH_ROLE) 
    {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            AkadIjarah storage akad = akads[_tokenIds[i]];
            if (akad.status == StatusAkad.DRAFT) {
                akad.status = StatusAkad.AKTIF;
                akad.timestampDeposit = uint64(block.timestamp);
                emit AkadApproved(_tokenIds[i], msg.sender);
            }
        }
    }
    
    // ============================================================
    // PHASE 2: OPERATIONAL STAKING
    // ============================================================
    
    /**
     * @notice Admin starts staking for approved akad
     * @dev Move funds to staking protocol
     */
    function startStaking(uint256 _tokenId) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        AkadIjarah storage akad = akads[_tokenId];
        if (akad.status != StatusAkad.AKTIF) revert InvalidStatus();
        
        akad.status = StatusAkad.STAKING;
        totalETHStaked += akad.ethAmount;
        
        emit StakingStarted(_tokenId);
    }
    
    /**
     * @notice Batch start staking (gas efficient)
     */
    function startStakingBatch(uint256[] calldata _tokenIds) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        uint128 totalStaked;
        
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            AkadIjarah storage akad = akads[_tokenIds[i]];
            if (akad.status == StatusAkad.AKTIF) {
                akad.status = StatusAkad.STAKING;
                totalStaked += akad.ethAmount;
                emit StakingStarted(_tokenIds[i]);
            }
        }
        
        totalETHStaked += totalStaked;
    }
    
    /**
     * @notice Admin harvests staking rewards from protocol
     * @dev Phase 2: Collect rewards before distribution
     */
    function harvestStakingRewards() 
        external 
        onlyRole(ADMIN_ROLE)
        nonReentrant
        returns (uint256 harvested)
    {
        // Get current contract balance (rewards)
        harvested = address(this).balance;
        
        require(harvested > 0, "No rewards to harvest");
        
        totalRewardsHarvested += harvested;
        
        emit RewardsHarvested(harvested, block.timestamp);
        
        return harvested;
    }
    
    /**
     * @notice Admin distributes ujrah to single user
     * @dev Phase 2: Pay ujrah from harvested rewards
     */
    function distributeUjrah(uint256 _tokenId) 
        external 
        payable
        onlyRole(ADMIN_ROLE)
        nonReentrant 
    {
        AkadIjarah storage akad = akads[_tokenId];
        
        // Validations
        if (akad.status != StatusAkad.AKTIF && akad.status != StatusAkad.STAKING) {
            revert InvalidStatus();
        }
        if (akad.ujrahDibayar) revert AlreadyPaid();
        if (msg.value < akad.ujrahTetap) revert InvalidAmount();
        
        // Mark as paid
        akad.ujrahDibayar = true;
        totalUjrahDibayar += akad.ujrahTetap;
        
        // Transfer ujrah to user
        (bool success, ) = payable(akad.mujir).call{value: akad.ujrahTetap}("");
        if (!success) revert TransferFailed();
        
        // Refund excess
        if (msg.value > akad.ujrahTetap) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - akad.ujrahTetap
            }("");
            if (!refundSuccess) revert TransferFailed();
        }
        
        emit UjrahDistributed(_tokenId, akad.mujir, akad.ujrahTetap, block.timestamp);
    }
    
    /**
     * @notice Admin distributes ujrah to multiple users (batch)
     * @dev Gas-efficient batch distribution
     */
    function distributeUjrahBatch(uint256[] calldata _tokenIds) 
        external 
        payable
        onlyRole(ADMIN_ROLE)
        nonReentrant 
    {
        uint256 totalRequired = 0;
        
        // Calculate total ujrah needed
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            AkadIjarah storage akad = akads[_tokenIds[i]];
            if (!akad.ujrahDibayar && 
                (akad.status == StatusAkad.AKTIF || akad.status == StatusAkad.STAKING)) {
                totalRequired += akad.ujrahTetap;
            }
        }
        
        require(msg.value >= totalRequired, "Insufficient payment");
        
        // Distribute to each user
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            AkadIjarah storage akad = akads[_tokenIds[i]];
            
            if (!akad.ujrahDibayar && 
                (akad.status == StatusAkad.AKTIF || akad.status == StatusAkad.STAKING)) {
                
                akad.ujrahDibayar = true;
                totalUjrahDibayar += akad.ujrahTetap;
                
                (bool success, ) = payable(akad.mujir).call{value: akad.ujrahTetap}("");
                if (!success) revert TransferFailed();
                
                emit UjrahDistributed(_tokenIds[i], akad.mujir, akad.ujrahTetap, block.timestamp);
            }
        }
        
        // Refund excess
        if (msg.value > totalRequired) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - totalRequired
            }("");
            if (!refundSuccess) revert TransferFailed();
        }
    }
    
    // ============================================================
    // PHASE 3: WITHDRAWAL
    // ============================================================
    
    /**
     * @notice User requests withdrawal
     * @dev Must wait until period ends and ujrah is paid
     */
    function requestWithdrawal(uint256 _tokenId) external nonReentrant {
        AkadIjarah storage akad = akads[_tokenId];
        
        // Validations
        if (token.ownerOf(_tokenId) != msg.sender) revert NotOwner();
        if (block.timestamp < akad.periodeAkhir) revert PeriodNotEnded();
        if (!akad.ujrahDibayar) revert UjrahNotPaid();
        if (akad.status != StatusAkad.STAKING && akad.status != StatusAkad.AKTIF) {
            revert InvalidStatus();
        }
        
        akad.status = StatusAkad.MENUNGGU_PENARIKAN;
        
        emit WithdrawalRequested(msg.sender, _tokenId, akad.ethAmount, block.timestamp);
    }
    
    /**
     * @notice Admin processes withdrawal & burns NFT
     * @dev Phase 3: Return principal and burn akad NFT
     */
    function executeWithdrawal(uint256 _tokenId) 
        external 
        onlyRole(ADMIN_ROLE)
        nonReentrant 
    {
        AkadIjarah storage akad = akads[_tokenId];
        if (akad.status != StatusAkad.MENUNGGU_PENARIKAN) revert InvalidStatus();
        
        // Update status
        akad.status = StatusAkad.SELESAI;
        akad.timestampPenarikan = uint64(block.timestamp);
        totalETHStaked -= akad.ethAmount;
        
        // Return principal to user
        (bool success, ) = payable(akad.mujir).call{value: akad.ethAmount}("");
        if (!success) revert TransferFailed();
        
        // Burn NFT akad
        token.burn(_tokenId);
        
        emit WithdrawalCompleted(akad.mujir, _tokenId, akad.ethAmount, block.timestamp);
        emit AkadNFTBurned(_tokenId, block.timestamp);
    }
    
    /**
     * @notice Batch withdrawal processing (gas efficient)
     */
    function executeWithdrawalBatch(uint256[] calldata _tokenIds) 
        external 
        onlyRole(ADMIN_ROLE)
        nonReentrant 
    {
        uint128 totalUnstaked;
        
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            AkadIjarah storage akad = akads[_tokenIds[i]];
            
            if (akad.status == StatusAkad.MENUNGGU_PENARIKAN) {
                akad.status = StatusAkad.SELESAI;
                akad.timestampPenarikan = uint64(block.timestamp);
                totalUnstaked += akad.ethAmount;
                
                // Return principal
                (bool success, ) = payable(akad.mujir).call{value: akad.ethAmount}("");
                if (!success) revert TransferFailed();
                
                // Burn NFT
                token.burn(_tokenIds[i]);
                
                emit WithdrawalCompleted(akad.mujir, _tokenIds[i], akad.ethAmount, block.timestamp);
                emit AkadNFTBurned(_tokenIds[i], block.timestamp);
            }
        }
        
        totalETHStaked -= totalUnstaked;
    }
    
    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================
    
    /**
     * @notice Update protocol config
     */
    function updateConfig(
        uint128 _minStake,
        uint128 _maxStake,
        uint32 _ujrahBp,
        uint32 _lockupDays
    ) external onlyRole(ADMIN_ROLE) {
        config.minStake = _minStake;
        config.maxStake = _maxStake;
        config.ujrahBasisPoints = _ujrahBp;
        config.periodeLockupDays = _lockupDays;
        
        emit ConfigUpdated(_minStake, _maxStake, _ujrahBp);
    }
    
    /**
     * @notice Toggle protocol active status
     */
    function toggleProtocol() external onlyRole(ADMIN_ROLE) {
        config.protokolAktif = !config.protokolAktif;
        emit ProtocolToggled(config.protokolAktif, block.timestamp);
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    /**
     * @notice Get akad detail
     */
    function getAkad(uint256 _tokenId) external view returns (
        address mujir,
        uint256 ethAmount,
        uint256 ujrahTetap,
        uint256 periodeAwal,
        uint256 periodeAkhir,
        StatusAkad status,
        bool ujrahDibayar,
        bool termsAgreed
    ) {
        AkadIjarah memory akad = akads[_tokenId];
        return (
            akad.mujir,
            akad.ethAmount,
            akad.ujrahTetap,
            akad.periodeAwal,
            akad.periodeAkhir,
            akad.status,
            akad.ujrahDibayar,
            akad.termsAgreed
        );
    }
    
    /**
     * @notice Get user's akads
     */
    function getUserAkads(address _user) external view returns (uint256[] memory) {
        return userAkads[_user];
    }
    
    /**
     * @notice Get platform stats
     */
    function getPlatformStats() external view returns (
        uint256 totalStaked,
        uint256 totalUjrah,
        uint256 totalAkads,
        uint256 totalHarvested,
        bool protokolStatus,
        bool isPaused
    ) {
        return (
            totalETHStaked,
            totalUjrahDibayar,
            _tokenIdCounter,
            totalRewardsHarvested,
            config.protokolAktif,
            paused()
        );
    }
    
    /**
     * @notice Get config
     */
    function getConfig() external view returns (
        uint256 minStake,
        uint256 maxStake,
        uint256 ujrahBp,
        uint256 lockupDays,
        bool isActive
    ) {
        return (
            config.minStake,
            config.maxStake,
            config.ujrahBasisPoints,
            config.periodeLockupDays,
            config.protokolAktif
        );
    }
    
    /**
     * @notice Calculate ujrah preview
     */
    function previewUjrah(uint256 _ethAmount, uint256 _periodeHari) 
        external 
        view 
        returns (uint256) 
    {
        return LibUjrah.hitungUjrah(
            _ethAmount,
            config.ujrahBasisPoints,
            _periodeHari
        );
    }
    
    /**
     * @notice Check if user has agreed to terms
     */
    function hasUserAgreedToTerms(address _user) external view returns (bool) {
        return hasAgreedToTerms[_user];
    }
    
    /**
     * @notice Get current terms hash
     */
    function getCurrentTermsHash() external view returns (bytes32) {
        return currentTermsHash;
    }
    
    /**
     * @notice Verify withdrawal eligibility (for Auditor)
     */
    function verifyWithdrawalEligibility(uint256 _tokenId) external view returns (
        bool isEligible,
        string memory reason
    ) {
        AkadIjarah memory akad = akads[_tokenId];
        
        if (akad.status != StatusAkad.STAKING && akad.status != StatusAkad.AKTIF) {
            return (false, "Invalid status");
        }
        if (block.timestamp < akad.periodeAkhir) {
            return (false, "Period not ended");
        }
        if (!akad.ujrahDibayar) {
            return (false, "Ujrah not paid");
        }
        
        return (true, "Eligible");
    }
    
    // ============================================================
    // RECEIVE & FALLBACK
    // ============================================================
    
    /**
     * @notice Receive ETH (for rewards/ujrah payments)
     */
    receive() external payable {
        // Accept ETH for ujrah payments or rewards
    }
    
    /**
     * @notice Fallback function
     */
    fallback() external payable {
        revert("Invalid function call");
    }
}