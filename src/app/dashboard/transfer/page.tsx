'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightLeft, ShieldCheck, Zap, Lock, Scan, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WalletConnect } from '@/components/wallet/WalletConnect'
import { apiClient, type CreateTransactionRequest } from '@/lib/api-client'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

export default function TransferPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')
  const [complete, setComplete] = useState(false)
  
  // Form state
  const [recipientAddress, setRecipientAddress] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [currency] = useState<string>('USDC')
  const [fromEmployeeId] = useState<string>('emp_demo_001') // This would come from auth context
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [isLoadingTxs, setIsLoadingTxs] = useState(false)

  // Load recent transactions
  useEffect(() => {
    loadRecentTransactions()
  }, [])

  const loadRecentTransactions = async () => {
    setIsLoadingTxs(true)
    try {
      const response = await apiClient.getEmployeeTransactions(fromEmployeeId, {
        limit: 3,
        status: 'CONFIRMED'
      })
      if (response.success && response.data) {
        setRecentTransactions(Array.isArray(response.data) ? response.data : [])
      }
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setIsLoadingTxs(false)
    }
  }

  const handleTransfer = async () => {
    // Validate inputs
    if (!recipientAddress || !amount) {
      setError('Please enter recipient address and amount')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Invalid amount')
      return
    }

    setError('')
    setIsProcessing(true)

    try {
      // Create transaction via API
      const transactionData: CreateTransactionRequest = {
        fromEmployeeId,
        toAddress: recipientAddress,
        amount: amount,
        currency,
        chain: 'sui', // or 'ethereum' based on selection
        privacyLevel: 'FULLY_PRIVATE', // Maximum privacy
      }

      const response = await apiClient.createTransaction(transactionData)

      if (response.success && response.data) {
        // Simulate ZK proof generation time
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        setTxHash(response.data.blockchainTxHash || response.data.transactionId)
        setComplete(true)
        
        // Reload recent transactions
        await loadRecentTransactions()
      } else {
        setError(response.error || 'Transaction failed')
      }
    } catch (err) {
      console.error('Transaction error:', err)
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setComplete(false)
    setTxHash('')
    setError('')
    setRecipientAddress('')
    setAmount('')
    setIsProcessing(false)
  }

  return (
    <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
        <div className="flex justify-between items-end border-b border-vault-slate/20 pb-4">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <ArrowRightLeft className="text-vault-green" /> 
                    ZK-TRANSFER PROTOCOL
                </h1>
                <p className="text-vault-slate text-sm font-mono mt-1">Encrypted Layer 2 Node-to-Node Transmission</p>
            </div>
            <div className="flex gap-2">
                <Badge variant="outline" className="font-mono text-vault-blue border-vault-blue/30 bg-vault-blue/10">NET_ID: 0x99</Badge>
                <Badge variant="outline" className="font-mono text-vault-green border-vault-green/30 bg-vault-green/10">TUNNEL: SECURE</Badge>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Transfer Form */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                <Card className="border-vault-slate/20 bg-vault-bg relative overflow-hidden">
                    {isProcessing && (
                         <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8">
                            <div className="relative w-24 h-24 mb-6">
                                <motion.div 
                                    className="absolute inset-0 border-4 border-vault-green rounded-full border-t-transparent"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                                <Lock className="absolute inset-0 m-auto text-white" />
                            </div>
                            <h3 className="text-lg font-mono text-vault-green animate-pulse">GENERATING ZK-SNARK PROOF...</h3>
                            <div className="w-full max-w-sm bg-vault-slate/20 h-1 mt-4 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-vault-green" 
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3 }}
                                />
                            </div>
                            <div className="font-mono text-xs text-vault-slate mt-2">Obfuscating transaction path...</div>
                        </div>
                    )}

                    {complete ? (
                        <div className="absolute inset-0 bg-vault-bg z-50 flex flex-col items-center justify-center p-8">
                            <motion.div 
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 bg-vault-green/10 rounded-full flex items-center justify-center text-vault-green mb-4"
                            >
                                <CheckCircle2 size={40} />
                            </motion.div>
                            <h2 className="text-2xl text-white font-bold mb-2">Transfer Complete</h2>
                            <p className="text-vault-slate font-mono text-center mb-6 max-w-md">
                              Transaction {txHash ? `hash ${txHash.slice(0, 10)}...` : 'verified'} on-chain. Zero-knowledge proof has been broadcast.
                            </p>
                            <Button onClick={reset} variant="default">New Transfer</Button>
                        </div>
                    ) : null}

                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-vault-slate">Transaction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-vault-slate uppercase flex justify-between">
                                <span>Recipient Address</span>
                                <span className="text-vault-blue cursor-pointer hover:underline">Scan QR</span>
                            </label>
                            <div className="relative">
                                <Scan className="absolute left-3 top-3 text-vault-slate w-5 h-5" />
                                <input 
                                    className="w-full bg-vault-slate/5 border border-vault-slate/20 rounded-md p-3 pl-10 font-mono text-sm text-white focus:border-vault-green focus:ring-1 focus:ring-vault-green outline-none transition-all"
                                    placeholder="0x... or name.eth"
                                    value={recipientAddress}
                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                />
                                {recipientAddress && recipientAddress.startsWith('0x') && recipientAddress.length > 10 && (
                                  <div className="absolute right-3 top-2.5">
                                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">VALID</Badge>
                                  </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-vault-slate uppercase flex justify-between">
                                <span>Amount</span>
                                <span className="text-vault-slate">Currency: {currency}</span>
                            </label>
                            <div className="relative">
                                <input 
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-full bg-vault-slate/5 border border-vault-slate/20 rounded-md p-4 pr-24 font-mono text-2xl text-white focus:border-vault-green focus:ring-1 focus:ring-vault-green outline-none transition-all font-bold placeholder:text-vault-slate/20"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <div className="absolute right-4 top-4 flex items-center gap-2">
                                    <div className="h-6 w-px bg-vault-slate/20"></div>
                                    <span className="font-bold text-vault-slate">{currency}</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 flex items-start gap-3">
                                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        )}

                        <Button 
                            onClick={handleTransfer} 
                            disabled={isProcessing || !recipientAddress || !amount}
                            className="w-full bg-vault-green text-black hover:bg-vault-green/90 h-12 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'PROCESSING...' : 'SIGN TRANSFER'}
                        </Button>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                             <div className="p-3 bg-vault-slate/5 rounded-md border border-vault-slate/10">
                                <div className="text-[10px] text-vault-slate uppercase font-mono mb-1">Estimated Gas</div>
                                <div className="text-sm font-bold text-white flex items-center gap-1">
                                    <Zap size={12} className="text-yellow-500" />
                                    0.0004 ETH
                                </div>
                             </div>
                             <div className="p-3 bg-vault-slate/5 rounded-md border border-vault-slate/10">
                                <div className="text-[10px] text-vault-slate uppercase font-mono mb-1">Privacy Level</div>
                                <div className="text-sm font-bold text-white flex items-center gap-1">
                                    <ShieldCheck size={12} className="text-vault-green" />
                                    MAXIMUM
                                </div>
                             </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Wallet Connection */}
                <WalletConnect />
            </motion.div>

            {/* Right Column: Recent Transfers */}
            <motion.div variants={itemVariants} className="space-y-6">
                <Card className="border-vault-slate/20 bg-vault-bg">
                    <CardHeader>
                        <CardTitle className="text-sm text-vault-slate uppercase">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoadingTxs ? (
                          <div className="p-8 text-center text-vault-slate text-sm">Loading...</div>
                        ) : recentTransactions.length > 0 ? (
                          recentTransactions.map((tx, i) => (
                            <div key={tx.id || i} className="flex items-center justify-between p-4 border-b border-vault-slate/10 last:border-0 hover:bg-vault-slate/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-vault-slate/10 flex items-center justify-center text-vault-slate group-hover:bg-vault-green/20 group-hover:text-vault-green transition-colors">
                                        <ArrowRightLeft size={14} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-mono text-white">
                                          {tx.toAddress ? `To ${tx.toAddress.slice(0, 6)}...${tx.toAddress.slice(-4)}` : 'Transfer'}
                                        </div>
                                        <div className="text-[10px] text-vault-slate">
                                          {new Date(tx.createdAt || tx.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-white">- {tx.amount} {tx.currency}</div>
                                    <div className="text-[10px] text-green-500">{tx.status}</div>
                                </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-vault-slate text-sm">No recent transactions</div>
                        )}
                    </CardContent>
                    <CardFooter className="pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-vault-slate hover:text-white"
                          onClick={loadRecentTransactions}
                        >
                          Refresh
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    </motion.div>
  )
}
