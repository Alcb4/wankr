// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/WankrSmartWallet.sol";

/**
 * @title DeployWankrSmartWallet
 * @dev Deployment script for WankrSmartWallet contract
 */
contract DeployWankrSmartWallet is Script {
    // Contract addresses
    address public constant WANKR_TOKEN = 0xa207C6E67ceA08641503947Ac05c65748bb9bB07; // WANKR token on Base
    address public constant NET_PROTOCOL = 0x00000000B24D62781dB359b07880a105cD0b64e6; // Net Protocol on Base

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying WankrSmartWallet contract...");
        console.log("Deployer:", deployer);
        console.log("WANKR Token:", WANKR_TOKEN);
        console.log("Net Protocol:", NET_PROTOCOL);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the smart wallet contract
        WankrSmartWallet smartWallet = new WankrSmartWallet(
            WANKR_TOKEN,
            NET_PROTOCOL,
            deployer // Set deployer as initial owner
        );

        vm.stopBroadcast();

        console.log("WankrSmartWallet deployed at:", address(smartWallet));
        
        // Verify contract info
        console.log("\nSmart Wallet Configuration:");
        console.log("WANKR Token Address:", address(smartWallet.wankrToken()));
        console.log("Net Protocol Address:", smartWallet.netProtocolContract());
        console.log("Owner:", smartWallet.owner());
        console.log("Max Message Length:", smartWallet.MAX_MESSAGE_LENGTH());
        console.log("Min Shame Amount:", smartWallet.MIN_SHAME_AMOUNT(), "WANKR");
        console.log("Max Shame Amount:", smartWallet.MAX_SHAME_AMOUNT(), "WANKR");
        console.log("Transaction Timeout:", smartWallet.TRANSACTION_TIMEOUT(), "seconds");

        // Save deployment info
        string memory deploymentInfo = string.concat(
            "WankrSmartWallet deployed at: ",
            vm.toString(address(smartWallet)),
            "\nDeployer: ",
            vm.toString(deployer),
            "\nWANKR Token: ",
            vm.toString(WANKR_TOKEN),
            "\nNet Protocol: ",
            vm.toString(NET_PROTOCOL),
            "\nFeatures: Gas sponsorship, batch transactions, signature verification"
        );

        // Try to save deployment info, but don't fail if we can't
        try vm.writeFile("smart-wallet-deployment-info.txt", deploymentInfo) {
            console.log("\nDeployment info saved to smart-wallet-deployment-info.txt");
        } catch {
            console.log("\nCould not save deployment info to file, but deployment was successful!");
        }
    }
}
