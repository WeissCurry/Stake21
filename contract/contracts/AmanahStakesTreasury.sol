// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AmanahStakesTreasury
 * @notice Mengelola treasury untuk risiko fluktuasi dan operasional
 */
contract AmanahStakesTreasury is AccessControl, ReentrancyGuard {
    
    bytes32 public constant TREASURY_ADMIN = keccak256("TREASURY_ADMIN");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    
    // ============ STATE ============
    
    uint256 public treasuryBalance;
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    
    // ============ EVENTS ============
    
    event TreasuryDeposit(address indexed from, uint256 amount, uint256 timestamp);
    event TreasuryWithdraw(address indexed to, uint256 amount, uint256 timestamp);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_ADMIN, msg.sender);
    }
    
    // ============ TREASURY FUNCTIONS ============
    
    /**
     * @notice Deposit ke treasury
     */
    function deposit() external payable {
        require(msg.value > 0, "Empty deposit");
        
        treasuryBalance += msg.value;
        totalDeposited += msg.value;
        
        emit TreasuryDeposit(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @notice Withdraw dari treasury (controlled)
     */
    function withdraw(address _to, uint256 _amount) 
        external 
        onlyRole(WITHDRAWER_ROLE)
        nonReentrant 
    {
        require(_amount > 0, "Zero amount");
        require(treasuryBalance >= _amount, "Insufficient balance");
        require(_to != address(0), "Invalid recipient");
        
        treasuryBalance -= _amount;
        totalWithdrawn += _amount;
        
        (bool success, ) = payable(_to).call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit TreasuryWithdraw(_to, _amount, block.timestamp);
    }
    
    /**
     * @notice Emergency withdraw (multi-sig recommended)
     */
    function emergencyWithdraw(address _to, uint256 _amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
    {
        require(_amount > 0, "Zero amount");
        require(_to != address(0), "Invalid recipient");
        
        uint256 contractBalance = address(this).balance;
        require(contractBalance >= _amount, "Insufficient balance");
        
        (bool success, ) = payable(_to).call{value: _amount}("");
        require(success, "Transfer failed");
        
        // Update accounting
        if (_amount <= treasuryBalance) {
            treasuryBalance -= _amount;
        } else {
            treasuryBalance = 0;
        }
        
        emit EmergencyWithdraw(_to, _amount);
    }
    
    /**
     * @notice Get treasury stats
     */
    function getTreasuryStats() external view returns (
        uint256 balance,
        uint256 deposited,
        uint256 withdrawn,
        uint256 contractBalance
    ) {
        return (
            treasuryBalance,
            totalDeposited,
            totalWithdrawn,
            address(this).balance
        );
    }
    
    /**
     * @notice Receive function
     */
    receive() external payable {
        treasuryBalance += msg.value;
        totalDeposited += msg.value;
        emit TreasuryDeposit(msg.sender, msg.value, block.timestamp);
    }
}