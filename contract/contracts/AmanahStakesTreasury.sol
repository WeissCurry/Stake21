// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AmanahStakesTreasury
 * @notice Mengelola treasury untuk risiko fluktuasi dan operasional
 * @dev SIMPLIFIED: Hanya ADMIN_ROLE yang kelola treasury
 */
contract AmanahStakesTreasury is AccessControl, ReentrancyGuard {
    
    // ============ ROLES (SIMPLIFIED) ============
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // ============ STATE VARIABLES ============
    
    uint256 public treasuryBalance;
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    uint256 public totalEmergencyWithdrawn;
    
    // Withdrawal tracking for audit
    struct WithdrawalRecord {
        address to;
        uint256 amount;
        uint64 timestamp;
        string purpose;
    }
    
    WithdrawalRecord[] public withdrawalHistory;
    
    // ============ EVENTS ============
    
    event TreasuryDeposit(
        address indexed from,
        uint256 amount,
        uint256 timestamp
    );
    
    event TreasuryWithdraw(
        address indexed to,
        uint256 amount,
        string purpose,
        uint256 timestamp
    );
    
    event EmergencyWithdraw(
        address indexed to,
        uint256 amount,
        string reason,
        uint256 timestamp
    );
    
    event TreasuryAllocated(
        address indexed allocatedTo,
        uint256 amount,
        string purpose,
        uint256 timestamp
    );
    
    // ============ ERRORS ============
    
    error ZeroAmount();
    error InvalidRecipient();
    error InsufficientBalance();
    error TransferFailed();
    error EmptyPurpose();
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    // ============ TREASURY FUNCTIONS ============
    
    /**
     * @notice Deposit ke treasury
     * @dev Anyone can deposit (for flexibility)
     */
    function deposit() external payable {
        if (msg.value == 0) revert ZeroAmount();
        
        treasuryBalance += msg.value;
        totalDeposited += msg.value;
        
        emit TreasuryDeposit(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @notice Admin withdraw from treasury with purpose
     * @dev Main withdrawal function with audit trail
     */
    function withdraw(
        address _to,
        uint256 _amount,
        string calldata _purpose
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        if (_to == address(0)) revert InvalidRecipient();
        if (treasuryBalance < _amount) revert InsufficientBalance();
        if (bytes(_purpose).length == 0) revert EmptyPurpose();
        
        // Update state
        treasuryBalance -= _amount;
        totalWithdrawn += _amount;
        
        // Record withdrawal
        withdrawalHistory.push(WithdrawalRecord({
            to: _to,
            amount: _amount,
            timestamp: uint64(block.timestamp),
            purpose: _purpose
        }));
        
        // Transfer
        (bool success, ) = payable(_to).call{value: _amount}("");
        if (!success) revert TransferFailed();
        
        emit TreasuryWithdraw(_to, _amount, _purpose, block.timestamp);
    }
    
    /**
     * @notice Allocate treasury funds for staking
     * @dev Used when moving funds to staking protocol
     */
    function allocateForStaking(
        address _stakingProtocol,
        uint256 _amount
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        if (_stakingProtocol == address(0)) revert InvalidRecipient();
        if (treasuryBalance < _amount) revert InsufficientBalance();
        
        treasuryBalance -= _amount;
        
        (bool success, ) = payable(_stakingProtocol).call{value: _amount}("");
        if (!success) revert TransferFailed();
        
        emit TreasuryAllocated(
            _stakingProtocol,
            _amount,
            "Staking allocation",
            block.timestamp
        );
    }
    
    /**
     * @notice Emergency withdraw (multi-sig recommended in production)
     * @dev For critical situations only
     */
    function emergencyWithdraw(
        address _to,
        uint256 _amount,
        string calldata _reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        if (_to == address(0)) revert InvalidRecipient();
        if (bytes(_reason).length == 0) revert EmptyPurpose();
        
        uint256 contractBalance = address(this).balance;
        if (contractBalance < _amount) revert InsufficientBalance();
        
        // Transfer first
        (bool success, ) = payable(_to).call{value: _amount}("");
        if (!success) revert TransferFailed();
        
        // Update accounting
        if (_amount <= treasuryBalance) {
            treasuryBalance -= _amount;
        } else {
            treasuryBalance = 0;
        }
        
        totalEmergencyWithdrawn += _amount;
        
        emit EmergencyWithdraw(_to, _amount, _reason, block.timestamp);
    }
    
    /**
     * @notice Reconcile treasury balance
     * @dev For fixing accounting discrepancies (admin only)
     */
    function reconcileBalance() external onlyRole(ADMIN_ROLE) {
        uint256 actualBalance = address(this).balance;
        treasuryBalance = actualBalance;
        
        emit TreasuryDeposit(
            msg.sender,
            0,
            block.timestamp
        );
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get treasury statistics
     */
    function getTreasuryStats() external view returns (
        uint256 balance,
        uint256 deposited,
        uint256 withdrawn,
        uint256 emergencyWithdrawn,
        uint256 contractBalance,
        uint256 withdrawalCount
    ) {
        return (
            treasuryBalance,
            totalDeposited,
            totalWithdrawn,
            totalEmergencyWithdrawn,
            address(this).balance,
            withdrawalHistory.length
        );
    }
    
    /**
     * @notice Get withdrawal history
     */
    function getWithdrawalHistory(uint256 _index) external view returns (
        address to,
        uint256 amount,
        uint64 timestamp,
        string memory purpose
    ) {
        require(_index < withdrawalHistory.length, "Invalid index");
        WithdrawalRecord memory record = withdrawalHistory[_index];
        return (record.to, record.amount, record.timestamp, record.purpose);
    }
    
    /**
     * @notice Get total withdrawal count
     */
    function getWithdrawalCount() external view returns (uint256) {
        return withdrawalHistory.length;
    }
    
    /**
     * @notice Get recent withdrawals (last N)
     */
    function getRecentWithdrawals(uint256 _count) external view returns (
        WithdrawalRecord[] memory
    ) {
        uint256 totalCount = withdrawalHistory.length;
        uint256 returnCount = _count > totalCount ? totalCount : _count;
        
        WithdrawalRecord[] memory recent = new WithdrawalRecord[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            recent[i] = withdrawalHistory[totalCount - returnCount + i];
        }
        
        return recent;
    }
    
    /**
     * @notice Check if treasury is healthy
     * @dev Returns true if actual balance matches accounting
     */
    function isTreasuryHealthy() external view returns (bool) {
        return address(this).balance >= treasuryBalance;
    }
    
    // ============ RECEIVE & FALLBACK ============
    
    /**
     * @notice Receive ETH deposits
     */
    receive() external payable {
        treasuryBalance += msg.value;
        totalDeposited += msg.value;
        emit TreasuryDeposit(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @notice Fallback function
     */
    fallback() external payable {
        treasuryBalance += msg.value;
        totalDeposited += msg.value;
        emit TreasuryDeposit(msg.sender, msg.value, block.timestamp);
    }
}