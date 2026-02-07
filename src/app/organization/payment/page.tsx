'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, Wallet as WalletIcon, AlertCircle, Shield, Info } from 'lucide-react'
import { walletService, WalletState } from '@/lib/wallet'

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('orgId')

  const [paymentConfig, setPaymentConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    connected: false,
  })
  const [employeeCount, setEmployeeCount] = useState(10)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState('')

  // Calculate amount: 0.005 ETH per 10 employees
  const calculateAmount = (count: number): string => {
    const groups = Math.ceil(count / 10)
    return (groups * 0.005).toFixed(4)
  }

  useEffect(() => {
    fetchPaymentConfig()
    
    // Setup wallet listeners
    walletService.onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setWalletState({ address: null, chainId: null, connected: false })
      } else {
        setWalletState(prev => ({ ...prev, address: accounts[0] }))
      }
    })

    walletService.onChainChanged((chainId) => {
      setWalletState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }))
    })

    return () => {
      walletService.removeListeners()
    }
  }, [])

  const fetchPaymentConfig = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/payment/config')
      const data = await response.json()
      if (data.success) {
        setPaymentConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching payment config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectWallet = async () => {
    try {
      setError('')
      const state = await walletService.connectWallet()
      setWalletState(state)

      // Check if on correct network
      if (state.chainId !== 84532) {
        await walletService.switchToBaseSepolia()
        const newState = await walletService.connectWallet()
        setWalletState(newState)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handlePayment = async () => {
    if (!walletState.connected || !paymentConfig || !organizationId) {
      return
    }

    try {
      setPaying(true)
      setError('')

      const amount = calculateAmount(employeeCount)
      
      // Send payment
      const result = await walletService.sendPayment(
        paymentConfig.treasuryAddress,
        amount
      )

      if (result.status === 'success') {
        setTxHash(result.txHash)
        
        // Verify payment with backend
        const response = await fetch('http://localhost:5001/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            txHash: result.txHash,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setPaid(true)
          setTimeout(() => {
            router.push(`/organization/complete?orgId=${organizationId}`)
          }, 2000)
        } else {
          setError('Payment verification failed. Please contact support with transaction hash.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-vault-darker border-vault-slate/20">
          <div className="w-20 h-20 rounded-full bg-vault-green/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-vault-green" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">Payment Successful!</h2>
          <p className="text-vault-slate mb-4">
            Your subscription has been activated successfully.
          </p>
          {txHash && (
            <div className="text-xs text-vault-slate/70 mb-6 break-all font-mono bg-vault-dark p-3 rounded">
              {txHash}
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-vault-slate/70">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to setup...
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Payment</h1>
          <p className="text-vault-slate">
            Connect your wallet and pay to activate your TrustNet subscription
          </p>
        </div>

        {/* Pricing Calculator */}
        <Card className="p-8 bg-vault-darker border-vault-slate/20 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Subscription Pricing</h3>
              <p className="text-sm text-vault-slate">Pay 0.005 ETH per 10 employees</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-vault-slate mb-2 block">
                Number of Employees
              </label>
              <input
                type="number"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                step="1"
                className="w-full px-4 py-3 bg-vault-dark border border-vault-slate/20 rounded-lg text-white focus:outline-none focus:border-vault-green/50"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-vault-dark rounded-lg border border-vault-slate/10">
              <span className="text-vault-slate">Total Amount</span>
              <span className="text-2xl font-bold text-vault-green">
                {calculateAmount(employeeCount)} ETH
              </span>
            </div>

            <div className="text-xs text-vault-slate/70 space-y-1">
              <p>• Groups of 10: {Math.ceil(employeeCount / 10)}</p>
              <p>• Rate: 0.005 ETH per 10 employees</p>
              <p>• Network: Base Sepolia Testnet</p>
            </div>
          </div>
        </Card>

        {/* Wallet Connection */}
        {!walletState.connected ? (
          <Card className="p-8 bg-vault-darker border-vault-slate/20">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-vault-green/10 flex items-center justify-center mx-auto">
                <WalletIcon className="w-8 h-8 text-vault-green" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-vault-slate mb-6">
                  You need to connect your wallet to proceed with the payment
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleConnectWallet}
                className="bg-vault-green text-vault-dark hover:bg-vault-green/90 font-semibold px-8 py-6 text-lg"
              >
                <WalletIcon className="w-5 h-5 mr-2" />
                Connect Wallet
              </Button>

              <div className="text-xs text-vault-slate/70">
                Make sure you have MetaMask or a compatible wallet installed
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8 bg-vault-darker border-vault-slate/20">
            <div className="space-y-6">
              {/* Wallet Info */}
              <div className="flex items-center justify-between p-4 bg-vault-dark rounded-lg border border-vault-slate/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-vault-green/10 flex items-center justify-center">
                    <WalletIcon className="w-5 h-5 text-vault-green" />
                  </div>
                  <div>
                    <p className="text-sm text-vault-slate">Connected Wallet</p>
                    <p className="font-mono text-sm text-white">
                      {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-vault-green animate-pulse"></div>
                  <span className="text-xs text-vault-green">Connected</span>
                </div>
              </div>

              {/* Network Warning */}
              {walletState.chainId !== 84532 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-500">Wrong Network</p>
                    <p className="text-xs text-yellow-500/80">Please switch to Base Sepolia</p>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={paying || walletState.chainId !== 84532}
                className="w-full bg-vault-green text-vault-dark hover:bg-vault-green/90 font-semibold py-6 text-lg"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Pay {calculateAmount(employeeCount)} ETH
                  </>
                )}
              </Button>

              <div className="text-xs text-center text-vault-slate/70">
                Your transaction is secured by blockchain technology
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
