// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title INetProtocol
 * @dev Interface for Net Protocol contract
 */
interface INetProtocol {
    function sendMessage(string calldata text, string calldata topic, bytes calldata data) external;
}

/**
 * @title SendShameAndMessage
 * @dev Helper contract for atomic shame sending with on-chain messages
 * @notice Allows users to transfer WANKR tokens and send a message in a single transaction
 * @author WANKR Team
 */
contract SendShameAndMessage is Ownable {
    // Immutable contract addresses for gas optimization
    IERC20 public immutable wankrToken;
    address public immutable netProtocolContract;
    
    // Events for monitoring and analytics
    event ShameSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        string message,
        string topic,
        uint256 timestamp
    );
    
    // Custom errors for gas efficiency
    error InsufficientAllowance();
    error InsufficientBalance();
    error InvalidAmount();
    error InvalidAddress();
    error MessageTooLong();

    // Constants
    uint256 public constant MAX_MESSAGE_LENGTH = 500; // Maximum message length
    uint256 public constant MIN_SHAME_AMOUNT = 1; // Minimum shame amount in WANKR
    uint256 public constant MAX_SHAME_AMOUNT = 1000; // Maximum shame amount in WANKR

    /**
     * @dev Constructor sets up the contract with required addresses
     * @param _wankrToken Address of the WANKR token contract
     * @param _netProtocolContract Address of the Net Protocol contract
     * @param _initialOwner Address of the contract owner
     */
    constructor(
        address _wankrToken,
        address _netProtocolContract,
        address _initialOwner
    ) Ownable(_initialOwner) {
        if (_wankrToken == address(0)) revert InvalidAddress();
        if (_netProtocolContract == address(0)) revert InvalidAddress();
        
        wankrToken = IERC20(_wankrToken);
        netProtocolContract = _netProtocolContract;
    }

    /**
     * @dev Main function to send shame and message atomically
     * @param to Recipient address
     * @param amount Amount of WANKR to send (in wei)
     * @param message Message to send via Net Protocol
     * @param topic Topic for the Net Protocol message
     */
    function sendShameAndMessage(
        address to,
        uint256 amount,
        string calldata message,
        string calldata topic
    ) external {
        // Input validation
        if (to == address(0)) revert InvalidAddress();
        if (amount < MIN_SHAME_AMOUNT * 1e18) revert InvalidAmount();
        if (amount > MAX_SHAME_AMOUNT * 1e18) revert InvalidAmount();
        if (bytes(message).length > MAX_MESSAGE_LENGTH) revert MessageTooLong();
        if (bytes(message).length == 0) revert MessageTooLong();

        address from = msg.sender;

        // Check allowance
        uint256 allowance = wankrToken.allowance(from, address(this));
        if (allowance < amount) revert InsufficientAllowance();

        // Check balance
        uint256 balance = wankrToken.balanceOf(from);
        if (balance < amount) revert InsufficientBalance();

        // Atomic transaction: both operations must succeed or both fail
        wankrToken.transferFrom(from, to, amount);
        _sendNetProtocolMessage(message, topic);
        
        // If we reach here, both operations succeeded
        emit ShameSent(from, to, amount, message, topic, block.timestamp);
    }

    /**
     * @dev Private function to send message via Net Protocol
     * @param message Message to send
     * @param topic Topic for the message
     */
    function _sendNetProtocolMessage(
        string calldata message,
        string calldata topic
    ) private {
        // Call the Net Protocol contract to send the message
        // If this fails, the entire transaction reverts (maintaining atomicity)
        INetProtocol(netProtocolContract).sendMessage(message, topic, "");
    }

    /**
     * @dev Emergency function to recover stuck tokens (only owner)
     * @param token Address of token to recover
     * @param to Address to send tokens to
     * @param amount Amount to recover
     */
    function emergencyRecover(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        
        IERC20(token).transfer(to, amount);
    }

    /**
     * @dev Get contract information
     * @return wankrTokenAddress Address of WANKR token
     * @return netProtocolAddress Address of Net Protocol contract
     * @return maxMessageLength Maximum allowed message length
     * @return minShameAmount Minimum shame amount in WANKR
     * @return maxShameAmount Maximum shame amount in WANKR
     */
    function getContractInfo() external view returns (
        address wankrTokenAddress,
        address netProtocolAddress,
        uint256 maxMessageLength,
        uint256 minShameAmount,
        uint256 maxShameAmount
    ) {
        return (
            address(wankrToken),
            netProtocolContract,
            MAX_MESSAGE_LENGTH,
            MIN_SHAME_AMOUNT,
            MAX_SHAME_AMOUNT
        );
    }
}
