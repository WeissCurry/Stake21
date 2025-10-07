// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AmanahStakesToken
 * @notice Soul Bound Token (SBT) sebagai bukti Akad Ijarah
 * @dev Token tidak bisa ditransfer (kecuali mint/burn)
 */
contract AmanahStakesToken is ERC721, AccessControl {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // Base URI untuk metadata
    string private _baseTokenURI;
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }
    
    /** Mint token baru (hanya oleh MINTER_ROLE) */
    function mint(address to, uint256 tokenId) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        _safeMint(to, tokenId);
    }
    
    /** Burn token (hanya oleh BURNER_ROLE) */
    function burn(uint256 tokenId) 
        external 
        onlyRole(BURNER_ROLE) 
    {
        _burn(tokenId);
    }
    
    /** Set base URI untuk metadata */
    function setBaseURI(string memory baseURI) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _baseTokenURI = baseURI;
    }
    
    /** Override _baseURI */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Override _update untuk blok transfer non-mint/burn
     * @dev Di OpenZeppelin v5, ini cara resmi blok transfer
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Izinkan hanya mint (from == 0) dan burn (to == 0)
        if (from != address(0) && to != address(0)) {
            revert("SBT: transfer not allowed");
        }

        return super._update(to, tokenId, auth);
    }

    /** Interface support */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
