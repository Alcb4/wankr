"use client"

import { useState } from 'react'
import { useWallet } from '../../hooks/useWallet'
import { Button, Modal } from '../ui'
// import { shortenAddress } from '../../utils/formatters'

export function WalletConnect() {
  const { address, balance, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })

  const handleWalletAction = async () => {
    if (isConnected) {
      // Get button position for modal positioning
      const button = document.querySelector('[data-wallet-button]') as HTMLElement
      if (button) {
        const rect = button.getBoundingClientRect()
        setButtonPosition({
          top: rect.top + window.scrollY,
          right: window.innerWidth - rect.right
        })
      }
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
        className="w-full min-h-[48px] text-lg font-semibold"
        data-wallet-button
        disabled={isConnecting}
      >
        {isConnecting 
          ? 'Connecting...' 
          : isConnected && balance !== null 
            ? `${Math.floor(parseFloat(balance)).toLocaleString()} WANKR`
            : isConnected 
              ? '0 WANKR'
              : 'Connect Wallet'
        }
      </Button>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Wallet Details"
        buttonPosition={buttonPosition}
      >
        <div className="flex flex-col gap-5">
          {/* Balance - Main focus */}
          {balance !== null && (
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {Math.floor(parseFloat(balance)).toLocaleString()}
              </div>
              <div className="text-xl font-semibold text-secondary mb-1">
                WANKR
              </div>
              <div className="text-sm text-muted-foreground">
                Available Balance
              </div>
            </div>
          )}

          {/* Wallet Info */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Wallet Address</div>
            <div className="font-mono text-xs bg-muted p-3 rounded-lg break-words whitespace-normal leading-relaxed">
              {address}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button 
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 text-sm"
            >
              Close
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDisconnect}
              className="px-6 py-2 text-sm"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
