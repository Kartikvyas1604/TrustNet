'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wallet, Loader2, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
      setShowModal(false)
    }, 1500)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
  }

  return (
    <>
      {!isConnected ? (
        <Button 
            variant="cyber" 
            onClick={() => setShowModal(true)}
            className="font-mono text-xs"
        >
            <Wallet className="mr-2 h-4 w-4" />
            CONNECT WALLET
        </Button>
      ) : (
        <Button 
            variant="outline" 
            onClick={handleDisconnect}
            className="font-mono text-xs border-vault-green/50 text-vault-green bg-vault-green/10"
        >
            <div className="w-2 h-2 rounded-full bg-vault-green mr-2 animate-pulse" />
            0x7A...8B94
        </Button>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-md bg-vault-bg border border-vault-slate/30 rounded-lg shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-vault-slate/20 flex justify-between items-center">
                    <h2 className="text-lg font-bold font-sans tracking-tight">Connect Wallet</h2>
                    <button onClick={() => setShowModal(false)} className="text-vault-slate hover:text-white">✕</button>
                </div>
                <div className="p-6 space-y-3">
                    <p className="text-sm text-vault-slate mb-4">Choose a wallet to connect to TrustNet Enterprise.</p>
                    
                    {['MetaMask', 'WalletConnect', 'Coinbase Wallet'].map((wallet) => (
                        <button 
                            key={wallet}
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-md border border-vault-slate/20 hover:border-vault-green/50 hover:bg-vault-slate/10 transition-all group",
                                isConnecting && "opacity-50 pointer-events-none"
                            )}
                        >
                            <span className="font-mono text-sm group-hover:text-vault-green transition-colors">{wallet}</span>
                            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin text-vault-green" /> : <ChevronDown className="h-4 w-4 -rotate-90 text-vault-slate" />}
                        </button>
                    ))}
                </div>
                <div className="p-4 bg-vault-slate/5 border-t border-vault-slate/20 text-center">
                    <p className="text-[10px] text-vault-slate">By connecting, you agree to our Terms of Service</p>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
