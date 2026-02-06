'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Wallet, Shield, ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OrganizationWalletPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [signature, setSignature] = useState<string>('')
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register')
      return
    }
    setOrganizationId(orgId)
  }, [router])

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to continue')
      return
    }

    setLoading(true)
    try {
      // Request account access
      if (!window.ethereum) {
        throw new Error('MetaMask not available')
      }
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      const address = accounts[0]
      setWalletAddress(address)
      setConnected(true)
    } catch (error: any) {
      alert('Wallet connection failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const signMessage = async () => {
    if (!walletAddress) return

    setSigning(true)
    try {
      // Get signature challenge from backend
      const challengeResponse = await fetch('/api/organization/wallet-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      })

      const { challenge } = await challengeResponse.json()

      // Check if ethereum is available
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed')
      }

      // Request signature from MetaMask
      const sig = await window.ethereum.request({
        method: 'personal_sign',
        params: [challenge, walletAddress],
      })

      setSignature(sig)

      // Verify signature with backend
      const verifyResponse = await fetch('/api/organization/register/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          walletAddress,
          signature: sig,
          challenge,
        }),
      })

      const data = await verifyResponse.json()

      if (data.success) {
        sessionStorage.setItem('walletConnected', 'true')
        // Wait a moment before redirect
        setTimeout(() => {
          router.push('/organization/register/pending')
        }, 1500)
      } else {
        alert('Signature verification failed')
        setSignature('')
      }
    } catch (error: any) {
      alert('Signing failed: ' + error.message)
      setSignature('')
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-3xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-vault-slate hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Connect Admin Wallet</h1>
          <p className="text-vault-slate">
            Connect the Ethereum wallet that will serve as your organization's treasury
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-500/10 border-blue-500/20 mb-8">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-100">
                <p className="font-semibold mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-200/80">
                  <li>This wallet will be the parent wallet for your organization</li>
                  <li>All employee wallets will be child wallets derived from this</li>
                  <li>External transactions require approval from this wallet</li>
                  <li>Keep this wallet secure - it controls your organization's funds</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Connection Card */}
        <Card className="bg-vault-darker border-vault-slate/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-vault-green" />
              Wallet Connection
            </CardTitle>
            <CardDescription>
              Connect your MetaMask wallet and sign a verification message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Connect */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    connected ? 'bg-vault-green' : 'bg-vault-slate/20'
                  }`}
                >
                  {connected ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-white font-medium">1</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white">Connect Wallet</h3>
              </div>

              {!connected ? (
                <Button
                  onClick={connectWallet}
                  disabled={loading}
                  className="w-full bg-vault-green hover:bg-vault-green/90 text-white h-12"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-5 w-5" />
                      Connect MetaMask
                    </>
                  )}
                </Button>
              ) : (
                <div className="p-4 bg-vault-dark rounded-lg">
                  <p className="text-sm text-vault-slate mb-1">Connected Address:</p>
                  <code className="text-vault-green text-sm break-all">{walletAddress}</code>
                </div>
              )}
            </div>

            {/* Step 2: Sign */}
            {connected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      signature ? 'bg-vault-green' : 'bg-vault-slate/20'
                    }`}
                  >
                    {signature ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-medium">2</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white">Sign Verification Message</h3>
                </div>

                {!signature ? (
                  <Button
                    onClick={signMessage}
                    disabled={signing}
                    className="w-full bg-vault-green hover:bg-vault-green/90 text-white h-12"
                  >
                    {signing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please sign in MetaMask...
                      </>
                    ) : (
                      <>Sign Message</>
                    )}
                  </Button>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="p-4 bg-vault-green/10 border border-vault-green rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-vault-green" />
                      <div>
                        <p className="text-white font-medium">Wallet Verified!</p>
                        <p className="text-sm text-vault-slate">Redirecting to approval queue...</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-vault-darker border-vault-slate/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Security Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-vault-slate">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-vault-green mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-white">Parent-Child Architecture:</strong> Your admin wallet
                  controls all employee child wallets
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-vault-green mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-white">Approval System:</strong> External transactions require
                  your explicit approval
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-vault-green mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-white">Off-chain Transfers:</strong> Internal transactions are
                  instant and free via Yellow Network
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-vault-green mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-white">ZK Privacy:</strong> Compliance proofs without exposing
                  transaction details
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
