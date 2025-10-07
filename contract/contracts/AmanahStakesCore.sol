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
 * @notice Core logic untuk platform staking syariah - Storage optimized
 * @dev Menggunakan packed structs dan efficient patterns
 */
contract AmanahStakesCore is AccessControl, ReentrancyGuard, Pausable {
    
    using LibUjrah for uint256;
    
    // ============ ROLES ============
    
    bytes32 public constant PLATFORM_ADMIN = keccak256("PLATFORM_ADMIN");
    bytes32 public constant DEWAN_SYARIAH = keccak256("DEWAN_SYARIAH");
    
    // ============ STRUCTS (PACKED) ============
    
    enum StatusAkad {
        DRAFT,              // 0
        AKTIF,             // 1
        STAKING,           // 2
        MENUNGGU_PENARIKAN, // 3
        SELESAI,           // 4
        DIBATALKAN         // 5
    }
    
    /// @notice Akad Ijarah (Optimized packing)
    struct AkadIjarah {
        address mujir;              // 20 bytes
        uint128 ethAmount;          // 16 bytes (packed dengan fields di bawah)
        uint128 ujrahTetap;         // 16 bytes
        uint64 periodeAwal;         // 8 bytes
        uint64 periodeAkhir;        // 8 bytes
        uint64 timestampDeposit;    // 8 bytes
        uint64 timestampPenarikan;  // 8 bytes (total 32 bytes slot)
        uint32 tokenId;             // 4 bytes
        StatusAkad status;          // 1 byte (uint8)
        bool ujrahDibayar;          // 1 byte
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
    
    ProtocolConfig public config;
    
    // Statistics (packed)
    uint128 public totalETHStaked;
    uint128 public totalUjrahDibayar;
    
    // ============ EVENTS ============
    
    event AkadCreated(
        uint256 indexed tokenId,
        address indexed mujir,
        uint256 ethAmount,
        uint256 ujrahTetap,
        uint256 periodeAkhir
    );
    
    event AkadApproved(uint256 indexed tokenId, address indexed approver);
    event StakingStarted(uint256 indexed tokenId);
    event UjrahPaid(uint256 indexed tokenId, address indexed mujir, uint256 amount);
    event PrincipalWithdrawn(uint256 indexed tokenId, address indexed mujir, uint256 amount);
    event ConfigUpdated(uint256 minStake, uint256 maxStake, uint256 ujrahBp);
    
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
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _token,
        address _registry,
        address payable  _treasury
    ) {
        require(_token != address(0), "Invalid token");
        require(_registry != address(0), "Invalid registry");
        require(_treasury != address(0), "Invalid treasury");
        
        token = AmanahStakesToken(_token);
        registry = SyariahRegistry(_registry);
        treasury = AmanahStakesTreasury(_treasury);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN, msg.sender);
        
        // Default config
        config = ProtocolConfig({
            minStake: uint128(0.01 ether),
            maxStake: uint128(32 ether),
            ujrahBasisPoints: 400,      // 4%
            periodeLockupDays: 30,
            protokolAktif: true
        });
    }
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @notice Buat akad ijarah baru
     */
    function buatAkad(uint256 _periodeHari) 
        external 
        payable 
        nonReentrant 
        whenNotPaused
        returns (uint256)
    {
        // Validations
        if (!registry.isPlatformCertified()) revert NotCertified();
        if (!config.protokolAktif) revert ProtocolInactive();
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
            ujrahDibayar: false
        });
        
        userAkads[msg.sender].push(tokenId);
        
        // Mint SBT
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
     */
    function approveAkad(uint256 _tokenId) 
        external 
        onlyRole(DEWAN_SYARIAH) 
    {
        AkadIjarah storage akad = akads[_tokenId];
        if (akad.status != StatusAkad.DRAFT) revert InvalidStatus();
        
        akad.status = StatusAkad.AKTIF;
        akad.timestampDeposit = uint64(block.timestamp);
        
        emit AkadApproved(_tokenId, msg.sender);
    }
    
    /**
     * @notice Platform mulai staking
     */
    function startStaking(uint256 _tokenId) 
        external 
        onlyRole(PLATFORM_ADMIN) 
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
        onlyRole(PLATFORM_ADMIN) 
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
     * @notice Bayar ujrah ke user
     */
    function bayarUjrah(uint256 _tokenId) 
        external 
        payable
        onlyRole(PLATFORM_ADMIN)
        nonReentrant 
    {
        AkadIjarah storage akad = akads[_tokenId];
        if (akad.status != StatusAkad.AKTIF && akad.status != StatusAkad.STAKING) {
            revert InvalidStatus();
        }
        if (akad.ujrahDibayar) revert("Already paid");
        if (msg.value < akad.ujrahTetap) revert InvalidAmount();
        
        akad.ujrahDibayar = true;
        totalUjrahDibayar += akad.ujrahTetap;
        
        // Transfer ujrah
        (bool success, ) = payable(akad.mujir).call{value: akad.ujrahTetap}("");
        if (!success) revert TransferFailed();
        
        // Refund excess
        if (msg.value > akad.ujrahTetap) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - akad.ujrahTetap
            }("");
            if (!refundSuccess) revert TransferFailed();
        }
        
        emit UjrahPaid(_tokenId, akad.mujir, akad.ujrahTetap);
    }
    
    /**
     * @notice User request withdrawal
     */
    function requestWithdrawal(uint256 _tokenId) external nonReentrant {
        AkadIjarah storage akad = akads[_tokenId];
        if (token.ownerOf(_tokenId) != msg.sender) revert NotOwner();
        if (block.timestamp < akad.periodeAkhir) revert PeriodNotEnded();
        if (!akad.ujrahDibayar) revert UjrahNotPaid();
        if (akad.status != StatusAkad.STAKING && akad.status != StatusAkad.AKTIF) {
            revert InvalidStatus();
        }
        
        akad.status = StatusAkad.MENUNGGU_PENARIKAN;
    }
    
    /**
     * @notice Platform process unstaking & return principal
     */
    function processUnstaking(uint256 _tokenId) 
        external 
        onlyRole(PLATFORM_ADMIN)
        nonReentrant 
    {
        AkadIjarah storage akad = akads[_tokenId];
        if (akad.status != StatusAkad.MENUNGGU_PENARIKAN) revert InvalidStatus();
        
        akad.status = StatusAkad.SELESAI;
        akad.timestampPenarikan = uint64(block.timestamp);
        totalETHStaked -= akad.ethAmount;
        
        // Return principal
        (bool success, ) = payable(akad.mujir).call{value: akad.ethAmount}("");
        if (!success) revert TransferFailed();
        
        emit PrincipalWithdrawn(_tokenId, akad.mujir, akad.ethAmount);
    }
    
    /**
     * @notice Batch process unstaking (gas efficient)
     */
    function processUnstakingBatch(uint256[] calldata _tokenIds) 
        external 
        onlyRole(PLATFORM_ADMIN)
        nonReentrant 
    {
        uint128 totalUnstaked;
        
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            AkadIjarah storage akad = akads[_tokenIds[i]];
            
            if (akad.status == StatusAkad.MENUNGGU_PENARIKAN) {
                akad.status = StatusAkad.SELESAI;
                akad.timestampPenarikan = uint64(block.timestamp);
                totalUnstaked += akad.ethAmount;
                
                (bool success, ) = payable(akad.mujir).call{value: akad.ethAmount}("");
                if (!success) revert TransferFailed();
                
                emit PrincipalWithdrawn(_tokenIds[i], akad.mujir, akad.ethAmount);
            }
        }
        
        totalETHStaked -= totalUnstaked;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Update protocol config
     */
    function updateConfig(
        uint128 _minStake,
        uint128 _maxStake,
        uint32 _ujrahBp,
        uint32 _lockupDays
    ) external onlyRole(PLATFORM_ADMIN) {
        config.minStake = _minStake;
        config.maxStake = _maxStake;
        config.ujrahBasisPoints = _ujrahBp;
        config.periodeLockupDays = _lockupDays;
        
        emit ConfigUpdated(_minStake, _maxStake, _ujrahBp);
    }
    
    /**
     * @notice Toggle protocol status
     */
    function toggleProtocol() external onlyRole(PLATFORM_ADMIN) {
        config.protokolAktif = !config.protokolAktif;
    }
    
    /**
     * @notice Pause/unpause (emergency)
     */
    function togglePause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (paused()) {
            _unpause();
        } else {
            _pause();
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
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
        bool ujrahDibayar
    ) {
        AkadIjarah memory akad = akads[_tokenId];
        return (
            akad.mujir,
            akad.ethAmount,
            akad.ujrahTetap,
            akad.periodeAwal,
            akad.periodeAkhir,
            akad.status,
            akad.ujrahDibayar
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
        bool protokolStatus
    ) {
        return (
            totalETHStaked,
            totalUjrahDibayar,
            _tokenIdCounter,
            config.protokolAktif
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
     * @notice Calculate ujrah for preview
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
    
    // ============ RECEIVE ============
    
    receive() external payable {
        // Forward to treasury
        (bool success, ) = address(treasury).call{value: msg.value}("");
        require(success, "Forward failed");
    }
}