// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SyariahRegistry
 * @notice Registry untuk sertifikasi dan audit syariah - Storage efficient
 * @dev Menggunakan bytes32 dan events untuk mengurangi storage cost
 */
contract SyariahRegistry is AccessControl {
    
    bytes32 public constant DEWAN_SYARIAH_ROLE = keccak256("DEWAN_SYARIAH_ROLE");
    bytes32 public constant AUDITOR_SYARIAH_ROLE = keccak256("AUDITOR_SYARIAH_ROLE");
    
    // ============ STRUCTS (PACKED) ============
    
    /// @notice Sertifikat Syariah (Storage optimized)
    struct SertifikatSyariah {
        bool valid;
        uint64 tanggalSertifikasi;  // Packed
        address dewanSyariah;       // 20 bytes
        bytes32 kodeRiba;           // Hash instead of string
        bytes32 kodeGharar;
        bytes32 kodeMaysir;
        bytes32 catatanHash;        // Hash dari catatan lengkap
    }
    
    // ============ STATE ============
    
    SertifikatSyariah public sertifikat;
    
    // Audit trail: simpan hanya hash, detail di events
    bytes32[] public auditHashes;
    
    // ============ EVENTS ============
    
    event SertifikatDiterbitkan(
        address indexed dewanSyariah,
        uint256 timestamp,
        bytes32 kodeRiba,
        bytes32 kodeGharar,
        bytes32 kodeMaysir,
        bytes32 catatanHash
    );
    
    event AuditDilakukan(
        uint256 indexed timestamp,
        address indexed auditor,
        bytes32 indexed jenisAuditHash,
        bytes32 hasilHash,
        bytes32 dataHash
    );
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    // ============ SERTIFIKASI ============
    
    /**
     * @notice Terbitkan sertifikat syariah
     * @dev Menggunakan bytes32 untuk efisiensi storage
     */
    function terbitkanSertifikat(
        bytes32 _kodeRiba,
        bytes32 _kodeGharar,
        bytes32 _kodeMaysir,
        bytes32 _catatanHash
    ) external onlyRole(DEWAN_SYARIAH_ROLE) {
        sertifikat = SertifikatSyariah({
            valid: true,
            tanggalSertifikasi: uint64(block.timestamp),
            dewanSyariah: msg.sender,
            kodeRiba: _kodeRiba,
            kodeGharar: _kodeGharar,
            kodeMaysir: _kodeMaysir,
            catatanHash: _catatanHash
        });
        
        emit SertifikatDiterbitkan(
            msg.sender,
            block.timestamp,
            _kodeRiba,
            _kodeGharar,
            _kodeMaysir,
            _catatanHash
        );
    }
    
    /**
     * @notice Revoke sertifikat
     */
    function revokeSertifikat() external onlyRole(DEWAN_SYARIAH_ROLE) {
        sertifikat.valid = false;
    }
    
    // ============ AUDIT (EVENT-BASED) ============
    
    /**
     * @notice Catat audit (storage efficient)
     * @dev Detail lengkap di events, hanya hash di storage
     */
    function catatAudit(
    bytes32 _jenisAuditHash,
    bytes32 _hasilHash,
    string calldata _jenisAuditText,
    string calldata _hasilText
) external onlyRole(AUDITOR_SYARIAH_ROLE) {
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

    emit AuditDilakukan(
        block.timestamp,
        msg.sender,
        _jenisAuditHash,
        _hasilHash,
        dataHash
    );
}

    
    /**
     * @notice Verifikasi audit hash exists
     */
    function verifyAuditHash(bytes32 _hash) external view returns (bool) {
        for (uint256 i = 0; i < auditHashes.length; i++) {
            if (auditHashes[i] == _hash) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @notice Get total audits
     */
    function getTotalAudits() external view returns (uint256) {
        return auditHashes.length;
    }
    
    /**
     * @notice Check platform certified
     */
    function isPlatformCertified() external view returns (bool) {
        return sertifikat.valid;
    }
    
    /**
     * @notice Helper: convert string to bytes32
     */
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