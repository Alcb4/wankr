// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SendShameAndMessage.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockWANKRToken
 * @dev Mock WANKR token for testing
 */
contract MockWANKRToken is ERC20 {
    constructor() ERC20("WANKR", "WANKR") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}

/**
 * @title MockNetProtocol
 * @dev Mock Net Protocol contract for testing
 */
contract MockNetProtocol {
    event MessageSent(string message, string topic, bytes data);
    
    function sendMessage(string calldata message, string calldata topic, bytes calldata data) external {
        emit MessageSent(message, topic, data);
    }
}

/**
 * @title MockFailingNetProtocol
 * @dev Mock Net Protocol contract that always fails
 */
contract MockFailingNetProtocol {
    function sendMessage(string calldata message, string calldata topic, bytes calldata data) external {
        revert("Message send failed");
    }
}

/**
 * @title SendShameAndMessageTest
 * @dev Comprehensive tests for SendShameAndMessage contract
 */
contract SendShameAndMessageTest is Test {
    SendShameAndMessage public shameContract;
    MockWANKRToken public wankrToken;
    MockNetProtocol public netProtocol;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public deployer = address(0x3);
    
    uint256 public constant SHAME_AMOUNT = 10 * 1e18; // 10 WANKR
    uint256 public constant APPROVAL_AMOUNT = 1000 * 1e18; // 1000 WANKR

    event ShameSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        string message,
        string topic,
        uint256 timestamp
    );
    


    function setUp() public {
        // Deploy mock contracts
        wankrToken = new MockWANKRToken();
        netProtocol = new MockNetProtocol();
        
        // Deploy shame contract
        shameContract = new SendShameAndMessage(
            address(wankrToken),
            address(netProtocol),
            deployer
        );
        
        // Setup test accounts with WANKR
        wankrToken.transfer(alice, 1000 * 1e18);
        wankrToken.transfer(bob, 1000 * 1e18);
        
        // Alice approves the shame contract
        vm.prank(alice);
        wankrToken.approve(address(shameContract), APPROVAL_AMOUNT);
    }

    function test_Constructor() public {
        (
            address wankrTokenAddress,
            address netProtocolAddress,
            uint256 maxMessageLength,
            uint256 minShameAmount,
            uint256 maxShameAmount
        ) = shameContract.getContractInfo();
        
        assertEq(wankrTokenAddress, address(wankrToken));
        assertEq(netProtocolAddress, address(netProtocol));
        assertEq(maxMessageLength, 500);
        assertEq(minShameAmount, 1);
        assertEq(maxShameAmount, 1000);
        assertEq(shameContract.owner(), deployer);
    }

    function test_SendShameAndMessage_Success() public {
        string memory message = "You deserve this shame!";
        string memory topic = "wankr-shame";
        
        uint256 aliceBalanceBefore = wankrToken.balanceOf(alice);
        uint256 bobBalanceBefore = wankrToken.balanceOf(bob);
        
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit ShameSent(alice, bob, SHAME_AMOUNT, message, topic, block.timestamp);
        
        shameContract.sendShameAndMessage(bob, SHAME_AMOUNT, message, topic);
        
        uint256 aliceBalanceAfter = wankrToken.balanceOf(alice);
        uint256 bobBalanceAfter = wankrToken.balanceOf(bob);
        
        assertEq(aliceBalanceAfter, aliceBalanceBefore - SHAME_AMOUNT);
        assertEq(bobBalanceAfter, bobBalanceBefore + SHAME_AMOUNT);
    }

    function test_SendShameAndMessage_InvalidAddress() public {
        vm.prank(alice);
        vm.expectRevert(SendShameAndMessage.InvalidAddress.selector);
        shameContract.sendShameAndMessage(address(0), SHAME_AMOUNT, "message", "topic");
    }

    function test_SendShameAndMessage_InvalidAmount_TooSmall() public {
        vm.prank(alice);
        vm.expectRevert(SendShameAndMessage.InvalidAmount.selector);
        shameContract.sendShameAndMessage(bob, 0, "message", "topic");
    }

    function test_SendShameAndMessage_InvalidAmount_TooLarge() public {
        vm.prank(alice);
        vm.expectRevert(SendShameAndMessage.InvalidAmount.selector);
        shameContract.sendShameAndMessage(bob, 1001 * 1e18, "message", "topic");
    }

    function test_SendShameAndMessage_MessageTooLong() public {
        string memory longMessage = new string(501);
        for (uint i = 0; i < 501; i++) {
            longMessage = string.concat(longMessage, "a");
        }
        
        vm.prank(alice);
        vm.expectRevert(SendShameAndMessage.MessageTooLong.selector);
        shameContract.sendShameAndMessage(bob, SHAME_AMOUNT, longMessage, "topic");
    }

    function test_SendShameAndMessage_EmptyMessage() public {
        vm.prank(alice);
        vm.expectRevert(SendShameAndMessage.MessageTooLong.selector);
        shameContract.sendShameAndMessage(bob, SHAME_AMOUNT, "", "topic");
    }

    function test_SendShameAndMessage_InsufficientAllowance() public {
        // Bob hasn't approved the contract
        vm.prank(bob);
        vm.expectRevert(SendShameAndMessage.InsufficientAllowance.selector);
        shameContract.sendShameAndMessage(alice, SHAME_AMOUNT, "message", "topic");
    }

    function test_SendShameAndMessage_InsufficientBalance() public {
        // Give Alice a small balance
        vm.prank(alice);
        wankrToken.transfer(bob, 999 * 1e18); // Leave Alice with 1 WANKR
        
        vm.prank(alice);
        vm.expectRevert(SendShameAndMessage.InsufficientBalance.selector);
        shameContract.sendShameAndMessage(bob, SHAME_AMOUNT, "message", "topic");
    }

    function test_SendShameAndMessage_TransferFailure() public {
        // Create a malicious token that always fails transfers
        MockWANKRToken maliciousToken = new MockWANKRToken();
        SendShameAndMessage maliciousContract = new SendShameAndMessage(
            address(maliciousToken),
            address(netProtocol),
            deployer
        );
        
        // Don't approve the malicious contract
        vm.prank(alice);
        vm.expectRevert(); // Should revert due to transfer failure
        maliciousContract.sendShameAndMessage(bob, SHAME_AMOUNT, "message", "topic");
    }

    function test_SendShameAndMessage_MessageFailure() public {
        // Create a malicious Net Protocol that always fails
        MockFailingNetProtocol maliciousNetProtocol = new MockFailingNetProtocol();
        SendShameAndMessage maliciousContract = new SendShameAndMessage(
            address(wankrToken),
            address(maliciousNetProtocol),
            deployer
        );
        
        // Alice approves the malicious contract
        vm.prank(alice);
        wankrToken.approve(address(maliciousContract), APPROVAL_AMOUNT);
        
        // The message send should fail and revert the entire transaction
        vm.prank(alice);
        vm.expectRevert("Message send failed"); // Should revert due to message failure
        maliciousContract.sendShameAndMessage(bob, SHAME_AMOUNT, "message", "topic");
    }

    function test_EmergencyRecover() public {
        // Send some tokens to the contract
        wankrToken.transfer(address(shameContract), 100 * 1e18);
        
        uint256 contractBalance = wankrToken.balanceOf(address(shameContract));
        assertEq(contractBalance, 100 * 1e18);
        
        // Only owner can recover
        vm.prank(alice);
        vm.expectRevert(); // Should revert - not owner
        shameContract.emergencyRecover(address(wankrToken), alice, 50 * 1e18);
        
        vm.prank(deployer);
        shameContract.emergencyRecover(address(wankrToken), alice, 50 * 1e18);
        
        uint256 aliceBalance = wankrToken.balanceOf(alice);
        uint256 contractBalanceAfter = wankrToken.balanceOf(address(shameContract));
        
        assertEq(aliceBalance, 1000 * 1e18 + 50 * 1e18); // Original + recovered
        assertEq(contractBalanceAfter, 50 * 1e18); // Remaining in contract
    }

    function test_EmergencyRecover_InvalidAddress() public {
        vm.prank(deployer);
        vm.expectRevert(SendShameAndMessage.InvalidAddress.selector);
        shameContract.emergencyRecover(address(wankrToken), address(0), 100 * 1e18);
    }

    function test_EmergencyRecover_InvalidAmount() public {
        vm.prank(deployer);
        vm.expectRevert(SendShameAndMessage.InvalidAmount.selector);
        shameContract.emergencyRecover(address(wankrToken), alice, 0);
    }

    function test_MultipleShameTransactions() public {
        string memory message1 = "First shame!";
        string memory message2 = "Second shame!";
        string memory topic = "wankr-shame";
        
        uint256 aliceBalanceBefore = wankrToken.balanceOf(alice);
        uint256 bobBalanceBefore = wankrToken.balanceOf(bob);
        
        // Send first shame
        vm.prank(alice);
        shameContract.sendShameAndMessage(bob, SHAME_AMOUNT, message1, topic);
        
        // Send second shame
        vm.prank(alice);
        shameContract.sendShameAndMessage(bob, SHAME_AMOUNT, message2, topic);
        
        uint256 aliceBalanceAfter = wankrToken.balanceOf(alice);
        uint256 bobBalanceAfter = wankrToken.balanceOf(bob);
        
        assertEq(aliceBalanceAfter, aliceBalanceBefore - (SHAME_AMOUNT * 2));
        assertEq(bobBalanceAfter, bobBalanceBefore + (SHAME_AMOUNT * 2));
    }

    function test_EdgeCase_MinimumAmount() public {
        uint256 minAmount = 1 * 1e18; // 1 WANKR
        string memory message = "Minimum shame!";
        string memory topic = "wankr-shame";
        
        vm.prank(alice);
        shameContract.sendShameAndMessage(bob, minAmount, message, topic);
        
        // Should succeed without reverting
    }

    function test_EdgeCase_MaximumAmount() public {
        uint256 maxAmount = 1000 * 1e18; // 1000 WANKR
        string memory message = "Maximum shame!";
        string memory topic = "wankr-shame";
        
        // Give Alice enough WANKR
        wankrToken.transfer(alice, 2000 * 1e18);
        
        vm.prank(alice);
        shameContract.sendShameAndMessage(bob, maxAmount, message, topic);
        
        // Should succeed without reverting
    }

    function test_EdgeCase_MaximumMessageLength() public {
        string memory maxMessage = "";
        for (uint i = 0; i < 500; i++) {
            maxMessage = string.concat(maxMessage, "a");
        }
        string memory topic = "wankr-shame";
        
        vm.prank(alice);
        shameContract.sendShameAndMessage(bob, SHAME_AMOUNT, maxMessage, topic);
        
        // Should succeed without reverting
    }
}
