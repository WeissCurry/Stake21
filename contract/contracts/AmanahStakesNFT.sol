// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


/**
 * @title AmanahStakesNFT
 * @notice NFT Certificate untuk Akad Ijarah (Stake Certificate)
 * @dev Setiap akad yang dibuat akan menerima NFT sebagai bukti kepemilikan
 */
contract AmanahStakesNFT is ERC721, ERC721Enumerable, AccessControl {
    uint256 private _nextTokenId;
    
    // ============ ROLES ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // ============ STRUCTS ============
    
    /// @notice Certificate metadata
    struct CertificateMetadata {
        uint256 akadId;                 // Reference to akad ID
        address user;                   // User address
        uint256 stakedAmount;           // ETH amount staked
        uint256 lockPeriodDays;         // Lock period in days
        uint256 expectedReward;         // Expected ujrah reward
        uint64 startTime;               // Start timestamp
        uint64 endTime;                 // End timestamp
        uint32 ujrahRate;               // Ujrah rate (basis points)
        string certificateName;         // Certificate name
    }
    
    // ============ STATE VARIABLES ============
    
  
    
    // Certificate data
    mapping(uint256 => CertificateMetadata) public certificates;
    mapping(uint256 => uint256) public akadIdToTokenId;    // akadId => NFT tokenId
    mapping(address => uint256[]) public userCertificates; // user => tokenIds array
    
    // Base URI for metadata
    string private baseURI;
    
    // ============ EVENTS ============
    
    event CertificateMinted(
        uint256 indexed tokenId,
        uint256 indexed akadId,
        address indexed user,
        uint256 stakedAmount,
        uint256 lockPeriodDays,
        uint256 expectedReward,
        uint256 timestamp
    );
    
    event CertificateBurned(
        uint256 indexed tokenId,
        uint256 indexed akadId,
        address indexed user,
        uint256 timestamp
    );
    
    event BaseURIUpdated(string newBaseURI, uint256 timestamp);
    
    // ============ ERRORS ============
    
    error TokenDoesNotExist();
    error NotAuthorizedToMint();
    error InvalidAkadId();
    error AkadAlreadyHasNFT();
    
    // ============ CONSTRUCTOR ============
    
    constructor(string memory baseURI_) ERC721("AmanahStakes Certificate", "AMNH-CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        
        baseURI = baseURI_;
        _nextTokenId = 1; // Start from 1
    }
    
    // ============================================================
    // MINTER FUNCTIONS (Called by AmanahStakesCore)
    // ============================================================
    
    /**
     * @notice Mint certificate NFT for new akad
     * @dev Only called by authorized minter (AmanahStakesCore)
     */
    function mintCertificate(
        uint256 _akadId,
        address _user,
        uint256 _stakedAmount,
        uint32 _lockPeriodDays,
        uint256 _expectedReward,
        uint64 _startTime,
        uint64 _endTime,
        uint32 _ujrahRate
    ) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        require(_user != address(0), "Invalid user address");
        require(_stakedAmount > 0, "Invalid staked amount");
        require(akadIdToTokenId[_akadId] == 0, "Akad already has NFT");

        tokenId = _nextTokenId;
        _nextTokenId++;

        // Store certificate metadata
        certificates[tokenId] = CertificateMetadata({
            akadId: _akadId,
            user: _user,
            stakedAmount: _stakedAmount,
            lockPeriodDays: _lockPeriodDays,
            expectedReward: _expectedReward,
            startTime: _startTime,
            endTime: _endTime,
            ujrahRate: _ujrahRate,
            certificateName: _generateCertificateName(_akadId, _stakedAmount)
        });
        
        // Link akad to token
        akadIdToTokenId[_akadId] = tokenId;
        userCertificates[_user].push(tokenId);
        
        // Mint NFT
        _safeMint(_user, tokenId);
        
        emit CertificateMinted(
            tokenId,
            _akadId,
            _user,
            _stakedAmount,
            _lockPeriodDays,
            _expectedReward,
            block.timestamp
        );
        
        return tokenId;
    }
    
    /**
     * @notice Burn certificate when akad is completed/cancelled
     * @dev Only called by authorized burner (AmanahStakesCore)
     */
    function burnCertificate(uint256 _tokenId) external onlyRole(BURNER_ROLE) {
        require(_exists(_tokenId), TokenDoesNotExist());
        
        CertificateMetadata memory cert = certificates[_tokenId];
        address owner = ownerOf(_tokenId);
        
        // Clean up mappings
        delete akadIdToTokenId[cert.akadId];
        delete certificates[_tokenId];
        
        // Remove from user's certificate array
        uint256[] storage userCerts = userCertificates[owner];
        for (uint256 i = 0; i < userCerts.length; i++) {
            if (userCerts[i] == _tokenId) {
                userCerts[i] = userCerts[userCerts.length - 1];
                userCerts.pop();
                break;
            }
        }
        
        // Burn NFT
        _burn(_tokenId);
        
        emit CertificateBurned(_tokenId, cert.akadId, owner, block.timestamp);
    }
    
    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================
    
    /**
     * @notice Update base URI for metadata
     */
    function setBaseURI(string memory _newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI, block.timestamp);
    }
    
    /**
     * @notice Grant minter role to address (e.g., AmanahStakesCore)
     */
    function grantMinterRole(address _minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, _minter);
    }
    
    /**
     * @notice Grant burner role to address
     */
    function grantBurnerRole(address _burner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(BURNER_ROLE, _burner);
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    /**
     * @notice Get certificate details by token ID
     */
    function getCertificate(uint256 _tokenId) 
        external 
        view 
        returns (CertificateMetadata memory) 
    {
        require(_exists(_tokenId), TokenDoesNotExist());
        return certificates[_tokenId];
    }
    
    /**
     * @notice Get all certificates owned by user
     */
    function getUserCertificates(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userCertificates[_user];
    }
    
    /**
     * @notice Get certificate by akad ID
     */
    function getCertificateByAkadId(uint256 _akadId) 
        external 
        view 
        returns (uint256 tokenId, CertificateMetadata memory) 
    {
        tokenId = akadIdToTokenId[_akadId];
        require(tokenId != 0, "No certificate for this akad");
        return (tokenId, certificates[tokenId]);
    }
    
    /**
     * @notice Check if akad has NFT certificate
     */
    function hasAkadNFT(uint256 _akadId) external view returns (bool) {
        return akadIdToTokenId[_akadId] != 0;
    }
    
    /**
     * @notice Get token ID for akad
     */
    function getTokenIdByAkadId(uint256 _akadId) external view returns (uint256) {
        return akadIdToTokenId[_akadId];
    }
    
    /**
     * @notice Get total certificates minted
     */
    function getTotalCertificatesMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    /**
     * @notice Get certificate details with earned reward
     */
    function getCertificateWithEarned(uint256 _tokenId, uint256 _earnedReward)
        external
        view
        returns (
            uint256 tokenId,
            address user,
            uint256 stakedAmount,
            uint256 lockPeriodDays,
            uint256 expectedReward,
            uint256 earnedReward,
            uint64 startTime,
            uint64 endTime,
            string memory name
        )
    {
        require(_exists(_tokenId), TokenDoesNotExist());
        CertificateMetadata memory cert = certificates[_tokenId];
        
        return (
            _tokenId,
            cert.user,
            cert.stakedAmount,
            cert.lockPeriodDays,
            cert.expectedReward,
            _earnedReward,
            cert.startTime,
            cert.endTime,
            cert.certificateName
        );
    }
    
    // ============================================================
    // INTERNAL FUNCTIONS
    // ============================================================
    
    /**
     * @notice Generate certificate name
     */
    function _generateCertificateName(uint256 _akadId, uint256 _amount) 
        internal 
        pure 
        returns (string memory) 
    {
       return string(
        abi.encodePacked(
            "AmanahStakes Cert #",
            _uint2str(_akadId),
            " (Staked: ",
            _uint2str(_amount),
            " ETH)"
        )
    );
    }
    
    /**
     * @notice Convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    // ============================================================
    // REQUIRED OVERRIDES
    // ============================================================
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
}