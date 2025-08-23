#!/bin/bash

# SendShameAndMessage Contract Deployment Script
echo "🚀 SendShameAndMessage Contract Deployment"
echo "========================================"

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set"
    echo ""
    echo "Please set your private key:"
    echo "export PRIVATE_KEY=your_private_key_here"
    echo ""
    echo "⚠️  Make sure your wallet has ETH on Base for gas fees!"
    exit 1
fi

# Display deployment info
echo "📋 Deployment Configuration:"
echo "   Network: Base Mainnet"
echo "   WANKR Token: 0xa207C6E67ceA08641503947Ac05c65748bb9bB07"
echo "   Net Protocol: 0x00000000B24D62781dB359b07880a105cD0b64e6"
echo ""

# Get deployer address
DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY)
echo "👤 Deployer Address: $DEPLOYER"

# Check ETH balance
echo "💰 Checking ETH balance on Base..."
BALANCE=$(cast balance $DEPLOYER --rpc-url https://mainnet.base.org)
echo "   Balance: $(cast to-unit $BALANCE ether) ETH"

if [ "$BALANCE" = "0" ]; then
    echo "❌ Error: Insufficient ETH balance for deployment"
    echo "   Please add ETH to your deployer address on Base"
    exit 1
fi

echo ""
echo "🔄 Starting deployment..."
echo ""

# Deploy the contract
forge script script/DeploySendShameAndMessage.s.sol:DeploySendShameAndMessage \
    --rpc-url base \
    --broadcast \
    --verify \
    -vvvv

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the contract address from the output above"
    echo "2. Update src/app/config/contract.ts with the new address"
    echo "3. Test the contract on Basescan"
    echo "4. Move to Phase 1.5 (gasless transactions)"
    echo ""
    echo "🎉 Phase 1 Foundation complete!"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    echo ""
    echo "Common issues:"
    echo "- Insufficient ETH balance"
    echo "- Network connectivity"
    echo "- Invalid private key"
fi

