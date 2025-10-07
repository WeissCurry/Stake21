// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AmanahStakesToken
 * @notice Soul Bound Token (SBT) sebagai bukti Akad Ijarah
 * @dev Token tidak bisa ditransfer (kecuali mint/burn)
 * @dev SIMPLIFIED: Hanya CORE_CONTRACT yang bisa mint/burn
 */
contract AmanahStakesToken is ERC721Enumerable, AccessControl {
    
    // ============ ROLES (SIMPLIFIED) ============
    
    bytes32 public constant CORE_CONTRACT = keccak256("CORE_CONTRACT");
    
    // ============ STATE VARIABLES ============
    
    string private _baseTokenURI;
    
    // Token metadata (optional, can be extended)
    mapping(uint256 => string) private _tokenURIs;
    
    // ============ EVENTS ============
    
    event TokenMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 timestamp
    );
    
    event TokenBurned(
        address indexed from,
        uint256 indexed tokenId,
        uint256 timestamp
    );
    
    event BaseURIUpdated(
        string newBaseURI,
        uint256 timestamp
    );
    
    event TokenURIUpdated(
        uint256 indexed tokenId,
        string newTokenURI,
        uint256 timestamp
    );
    
    // ============ ERRORS ============
    
    error TransferNotAllowed();
    error InvalidTokenId();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _baseTokenURI = baseURI;
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @notice Mint token baru (hanya Core Contract)
     * @dev Called when user creates Akad Ijarah
     */
    function mint(address to, uint256 tokenId) 
        external 
        onlyRole(CORE_CONTRACT) 
    {
        _safeMint(to, tokenId);
        emit TokenMinted(to, tokenId, block.timestamp);
    }
    
    /**
     * @notice Burn token (hanya Core Contract)
     * @dev Called when withdrawal is completed
     */
    function burn(uint256 tokenId) 
        external 
        onlyRole(CORE_CONTRACT) 
    {
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        emit TokenBurned(owner, tokenId, block.timestamp);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Set base URI untuk metadata
     */
    function setBaseURI(string memory baseURI) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI, block.timestamp);
    }
    
    /**
     * @notice Set individual token URI (optional)
     * @dev FIXED: renamed parameter to avoid shadowing
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        _tokenURIs[tokenId] = _tokenURI;
        emit TokenURIUpdated(tokenId, _tokenURI, block.timestamp);
    }
    
    // ============ SBT LOGIC (Non-Transferable) ============
    
    /**
     * @notice Override _update untuk blok transfer non-mint/burn
     * @dev Soul Bound Token: tidak bisa ditransfer
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override(ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);

        // Izinkan hanya mint (from == 0) dan burn (to == 0)
        if (from != address(0) && to != address(0)) {
            revert TransferNotAllowed();
        }

        return super._update(to, tokenId, auth);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Override _baseURI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @notice Get token URI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        
        string memory customURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        
        // If there is no base URI, return the custom token URI
        if (bytes(base).length == 0) {
            return customURI;
        }
        
        // If both are set, concatenate the baseURI and tokenURI
        if (bytes(customURI).length > 0) {
            return string(abi.encodePacked(base, customURI));
        }
        
        // Default: base + tokenId
        return super.tokenURI(tokenId);
    }
    
    /**
     * @notice Get all tokens owned by user
     */
    function tokensOfOwner(address owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokens;
    }
    
    /**
     * @notice Check if token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @notice Get total supply
     */
    function getTotalSupply() external view returns (uint256) {
        return totalSupply();
    }
    
    /**
     * @notice Get custom token URI (if set)
     */
    function getCustomTokenURI(uint256 tokenId) external view returns (string memory) {
        return _tokenURIs[tokenId];
    }
    
    /**
     * @notice Get base URI
     */
    function getBaseURI() external view returns (string memory) {
        return _baseTokenURI;
    }
    
    // ============ INTERFACE SUPPORT ============
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}