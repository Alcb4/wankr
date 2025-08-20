"use client"

import { useWallet } from '../../hooks/useWallet'
import { Button, Card } from '../ui'

export function WalletConnect() {
  const { address, balance, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet()

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-3">
        <Card variant="base" padding="sm">
          <h3 className="text-primary font-semibold mb-2 text-sm">
            Connected Wallet
          </h3>
          <div className="font-mono bg-muted p-2 rounded text-xs break-all">
            {address}
          </div>
        </Card>
        
        {balance && (
          <div className="text-lg font-semibold text-secondary">
            Balance: {parseFloat(balance).toFixed(2)} WANKR
          </div>
        )}
        
        <Button 
          variant="primary"
          onClick={disconnectWallet}
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button 
      variant="primary"
      isLoading={isConnecting}
      onClick={connectWallet}
      className="w-full"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  )
}
