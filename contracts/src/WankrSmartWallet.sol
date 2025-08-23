// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title INetProtocol
 * @dev Interface for Net Protocol contract
 */
interface INetProtocol {
    function sendMessage(string calldata text, string calldata topic, bytes calldata data) external;
}

/**
 * @title WankrSmartWallet
 * @dev Secure smart wallet for WANKR shame sending with gas sponsorship
 * @notice Uses EIP-712 for secure signature verification and proper nonce management
 * @author WANKR Team
 */
contract WankrSmartWallet is Ownable {
    using ECDSA for bytes32;

    // Immutable contract addresses
    IERC20 public immutable wankrToken;
    address public immutable netProtocolContract;
    
    // Events
    event ShameSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        string message,
        string topic,
        uint256 timestamp
    );

    event GasSponsored(
        address indexed user,
        uint256 gasCost,
        uint256 timestamp
    );

    // Custom errors
    error InsufficientBalance();
    error InvalidAmount();
    error InvalidAddress();
    error MessageTooLong();
    error InvalidSignature();
    error InvalidNonce();
    error ExpiredTransaction();
    error TransferFailed();
    error BatchSizeExceeded();

    // Constants
    uint256 public constant MAX_MESSAGE_LENGTH = 500;
    uint256 public constant MIN_SHAME_AMOUNT = 1;
    uint256 public constant MAX_SHAME_AMOUNT = 1000;
    uint256 public constant TRANSACTION_TIMEOUT = 1 hours;
    uint256 public constant MAX_BATCH_SIZE = 20;

    // EIP-712 constants
    bytes32 public immutable DOMAIN_SEPARATOR;
    
    bytes32 public constant SHAME_TRANSACTION_TYPEHASH = keccak256(
        "ShameTransaction(address to,uint256 amount,string message,string topic,address userAddress,uint256 nonce,uint256 deadline)"
    );

    // State variables - proper nonce management
    mapping(address => uint256) public userNonces;

    /**
     * @dev Constructor
     * @param _wankrToken WANKR token address
     * @param _netProtocol Net Protocol contract address
     * @param _initialOwner Initial owner address
     */
    constructor(
        address _wankrToken,
        address _netProtocol,
        address _initialOwner
    ) Ownable(_initialOwner) {
        if (_wankrToken == address(0)) revert InvalidAddress();
        if (_netProtocol == address(0)) revert InvalidAddress();
        
        wankrToken = IERC20(_wankrToken);
        netProtocolContract = _netProtocol;
        
        // Compute EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("WankrSmartWallet")),
                keccak256(bytes("1.0.0")),
                8453, // Base mainnet chainId
                address(this)
            )
        );
    }

    /**
     * @dev Send shame with gas sponsorship (only owner can call)
     * @param to Recipient address
     * @param amount Amount of WANKR to send
     * @param message Message to send
     * @param topic Topic for the message
     * @param userAddress User who initiated the transaction
     * @param nonce User's current nonce
     * @param deadline Transaction deadline
     * @param signature User signature
     */
    function sendShameWithGasSponsorship(
        address to,
        uint256 amount,
        string calldata message,
        string calldata topic,
        address userAddress,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external onlyOwner {
        _processShameTransaction(
            to,
            amount,
            message,
            topic,
            userAddress,
            nonce,
            deadline,
            signature
        );
    }

    /**
     * @dev Batch send shame (multiple transactions in one)
     * @param transactions Array of shame transactions
     */
    function batchSendShame(
        ShameTransaction[] calldata transactions
    ) external onlyOwner {
        if (transactions.length > MAX_BATCH_SIZE) revert BatchSizeExceeded();
        
        for (uint256 i = 0; i < transactions.length; i++) {
            ShameTransaction calldata shameTx = transactions[i];
            _processShameTransaction(
                shameTx.to,
                shameTx.amount,
                shameTx.message,
                shameTx.topic,
                shameTx.userAddress,
                shameTx.nonce,
                shameTx.deadline,
                shameTx.signature
            );
        }
    }

    /**
     * @dev Internal function to process a single shame transaction
     * @param to Recipient address
     * @param amount Amount of WANKR to send
     * @param message Message to send
     * @param topic Topic for the message
     * @param userAddress User who initiated the transaction
     * @param nonce User's current nonce
     * @param deadline Transaction deadline
     * @param signature User signature
     */
    function _processShameTransaction(
        address to,
        uint256 amount,
        string calldata message,
        string calldata topic,
        address userAddress,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) internal {
        // Validate inputs
        if (to == address(0)) revert InvalidAddress();
        if (amount < MIN_SHAME_AMOUNT * 1e18) revert InvalidAmount();
        if (amount > MAX_SHAME_AMOUNT * 1e18) revert InvalidAmount();
        if (bytes(message).length > MAX_MESSAGE_LENGTH) revert MessageTooLong();
        if (bytes(message).length == 0) revert MessageTooLong();
        if (block.timestamp > deadline) revert ExpiredTransaction();
        
        // Validate nonce - CRITICAL FIX: Proper nonce validation
        if (nonce != userNonces[userAddress]) revert InvalidNonce();

        // Verify EIP-712 signature - CRITICAL FIX: EIP-712 compliance
        bytes32 structHash = keccak256(abi.encode(
            SHAME_TRANSACTION_TYPEHASH,
            to,
            amount,
            message,
            topic,
            userAddress,
            nonce,
            deadline
        ));
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        address recoveredAddress = hash.recover(signature);
        
        if (recoveredAddress != userAddress) revert InvalidSignature();

        // Increment nonce BEFORE processing - CRITICAL FIX: Prevent reentrancy
        userNonces[userAddress]++;

        // Transfer WANKR from user to recipient - CRITICAL FIX: Check return value
        bool success = wankrToken.transferFrom(userAddress, to, amount);
        if (!success) revert TransferFailed();

        // Send message via Net Protocol
        INetProtocol(netProtocolContract).sendMessage(message, topic, "");

        // Emit events
        emit ShameSent(userAddress, to, amount, message, topic, block.timestamp);
        emit GasSponsored(userAddress, 0, block.timestamp);
    }

    /**
     * @dev Emergency function to recover stuck tokens (only owner)
     * @param token Token address
     * @param to Recipient address
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

    // Structs
    struct ShameTransaction {
        address to;
        uint256 amount;
        string message;
        string topic;
        address userAddress;
        uint256 nonce;
        uint256 deadline;
        bytes signature;
    }
}
