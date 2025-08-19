"use client"

import { useWallet } from '../../hooks/useWallet'

export function WalletConnect() {
  const { address, balance, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet()

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-primary font-semibold mb-2 text-sm">
            Connected Wallet
          </h3>
          <div className="font-mono bg-muted p-2 rounded text-xs break-all">
            {address}
          </div>
        </div>
        
        {balance && (
          <div className="text-lg font-semibold text-secondary">
            Balance: {parseFloat(balance).toFixed(2)} WANKR
          </div>
        )}
        
        <button 
          onClick={disconnectWallet}
          className="bg-gradient-cta text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-gradient-cta text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed w-full"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
