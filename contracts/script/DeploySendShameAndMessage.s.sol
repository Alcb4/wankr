// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SendShameAndMessage.sol";

/**
 * @title DeploySendShameAndMessage
 * @dev Deployment script for SendShameAndMessage contract
 */
contract DeploySendShameAndMessage is Script {
    // Contract addresses (these will be set via environment variables or constructor)
    address public constant WANKR_TOKEN = 0xa207C6E67ceA08641503947Ac05c65748bb9bB07; // WANKR token on Base
    address public constant NET_PROTOCOL = 0x00000000B24D62781dB359b07880a105cD0b64e6; // Net Protocol on Base

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying SendShameAndMessage contract...");
        console.log("Deployer:", deployer);
        console.log("WANKR Token:", WANKR_TOKEN);
        console.log("Net Protocol:", NET_PROTOCOL);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        SendShameAndMessage shameContract = new SendShameAndMessage(
            WANKR_TOKEN,
            NET_PROTOCOL,
            deployer // Set deployer as initial owner
        );

        vm.stopBroadcast();

        console.log("SendShameAndMessage deployed at:", address(shameContract));
        
        // Verify contract info
        (
            address wankrTokenAddress,
            address netProtocolAddress,
            uint256 maxMessageLength,
            uint256 minShameAmount,
            uint256 maxShameAmount
        ) = shameContract.getContractInfo();

        console.log("\nContract Configuration:");
        console.log("WANKR Token Address:", wankrTokenAddress);
        console.log("Net Protocol Address:", netProtocolAddress);
        console.log("Max Message Length:", maxMessageLength);
        console.log("Min Shame Amount:", minShameAmount, "WANKR");
        console.log("Max Shame Amount:", maxShameAmount, "WANKR");

        // Save deployment info
        string memory deploymentInfo = string.concat(
            "SendShameAndMessage deployed at: ",
            vm.toString(address(shameContract)),
            "\nDeployer: ",
            vm.toString(deployer),
            "\nWANKR Token: ",
            vm.toString(WANKR_TOKEN),
            "\nNet Protocol: ",
            vm.toString(NET_PROTOCOL)
        );

        // Try to save deployment info, but don't fail if we can't
        try vm.writeFile("deployment-info.txt", deploymentInfo) {
            console.log("\nDeployment info saved to deployment-info.txt");
        } catch {
            console.log("\nCould not save deployment info to file, but deployment was successful!");
        }
    }
}
