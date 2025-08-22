"use client"

import { useState } from 'react'
import { useWallet } from '../../hooks/useWallet'
import { Button, Modal } from '../ui'

export function CompactWalletConnect() {
  const { address, balance, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleWalletAction = async () => {
    if (isConnected) {
      setIsModalOpen(true)
    } else {
      await connectWallet()
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setIsModalOpen(false)
  }

  return (
    <>
      <Button 
        variant="default"
        onClick={handleWalletAction}
        className={`
          px-4 py-2 text-sm font-medium h-9 flex items-center justify-center gap-2
          transition-all duration-300 ease-out
          ${isConnected 
            ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl' 
            : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md hover:shadow-lg'
          }
          hover:scale-105 hover:-translate-y-0.5
          border border-primary/20
          backdrop-blur-sm
        `}
        size="sm"
      >
        {/* Button Text */}
        <span className="font-semibold">
          {isConnecting 
            ? 'Connecting...' 
            : isConnected && balance !== null 
              ? `${Math.floor(parseFloat(balance)).toLocaleString()} WANKR`
              : isConnected 
                ? '0 WANKR'
                : 'Connect'
          }
        </span>
        
        {/* Wallet Icon */}
        <div className="flex-shrink-0">
          {isConnected ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6z"/>
              <path d="M4 12h16v2H4z"/>
              <circle cx="7" cy="9" r="1"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          )}
        </div>
        
        {/* Connection Status Indicator */}
        {isConnected && (
          <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </Button>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Wallet Details"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Address</label>
            <p className="text-sm font-mono bg-muted p-2 rounded">{address}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Balance</label>
            <p className="text-lg font-bold text-primary">{balance ? `${parseFloat(balance).toLocaleString()} WANKR` : '0 WANKR'}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDisconnect} variant="destructive" className="flex-1">
              Disconnect
            </Button>
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
