# SendShameAndMessage Contract Deployment Guide

## Prerequisites

1. **Private Key**: You need a private key with ETH on Base for gas fees
2. **Etherscan API Key**: For contract verification (optional but recommended)

## Environment Setup

Create a `.env` file in the `contracts/` directory:

```bash
# Deployment Configuration
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**⚠️ IMPORTANT**: Never commit the `.env` file to git!

## Deployment Commands

### 1. Deploy to Base Mainnet

```bash
forge script script/DeploySendShameAndMessage.s.sol:DeploySendShameAndMessage --rpc-url base --broadcast --verify
```

### 2. Deploy without verification (if Etherscan API key not available)

```bash
forge script script/DeploySendShameAndMessage.s.sol:DeploySendShameAndMessage --rpc-url base --broadcast
```

### 3. Verify contract after deployment (if not done during deployment)

```bash
forge verify-contract <CONTRACT_ADDRESS> src/SendShameAndMessage.sol:SendShameAndMessage --chain base --watch
```

## Post-Deployment Steps

1. **Save the contract address** from the deployment output
2. **Update frontend configuration** in `src/app/config/contract.ts`:
   ```typescript
   export const SEND_SHAME_AND_MESSAGE_ADDRESS = '0x...' // Your deployed address
   ```
3. **Test the contract** on Basescan to ensure it's working correctly
4. **Fund the contract owner** if needed for emergency functions

## Deployment Output

The deployment script will output:
- Contract address
- Deployer address
- Gas used
- Transaction hash
- Verification status

## Troubleshooting

### Common Issues:

1. **Insufficient funds**: Make sure your deployer address has enough ETH for gas
2. **Network issues**: Check your RPC URL and internet connection
3. **Verification failed**: Check your Etherscan API key and try manual verification

### Manual Verification:

If automatic verification fails, you can verify manually on Basescan:
1. Go to the contract address on Basescan
2. Click "Verify and Publish"
3. Upload the contract source code
4. Set compiler version to 0.8.20
5. Enable optimization with 200 runs

## Contract Information

- **Contract Name**: SendShameAndMessage
- **Solidity Version**: 0.8.20
- **Optimization**: Enabled (200 runs)
- **WANKR Token**: 0xa207C6E67ceA08641503947Ac05c65748bb9bB07
- **Net Protocol**: 0x00000000B24D62781dB359b07880a105cD0b64e6

## Security Notes

- The contract is immutable (cannot be upgraded)
- Emergency recovery function is only accessible by owner
- All funds are handled through standard ERC-20 transfers
- Contract has been thoroughly tested with 18 test cases

