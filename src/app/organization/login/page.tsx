'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Wallet, Shield, Loader2, AlertCircle, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ethers } from 'ethers'

export default function OrganizationLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [error, setError] = useState<string>('')

  const connectAndLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Check if MetaMask is installed
      const ethereum = (window as any).ethereum
      if (!ethereum) {
        throw new Error('MetaMask is not installed. Please install it to continue.')
      }

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      const address = accounts[0]
      setWalletAddress(address)

      // Call wallet-login endpoint to get organizations
      const response = await fetch('/api/auth/organization/wallet-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      if (!data.success) {
        throw new Error(data.error || 'No organizations found for this wallet')
      }

      const orgs = data.organizations || []
      
      if (orgs.length === 0) {
        setError('No organizations found for this wallet. Please register a new organization.')
        return
      }

      setOrganizations(orgs)

      // If only one organization, auto-select and login
      if (orgs.length === 1) {
        await loginToOrganization(orgs[0].id, address)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  const loginToOrganization = async (orgId: string, wallet: string) => {
    try {
      // Get authentication challenge
      const challengeResponse = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'organization',
          identifier: orgId,
          walletAddress: wallet 
        }),
      })

      const { challenge } = await challengeResponse.json()

      // Sign the challenge
      const ethereum = (window as any).ethereum
      const provider = new ethers.BrowserProvider(ethereum)
      const signer = await provider.getSigner()
      const signature = await signer.signMessage(challenge)

      // Verify signature and establish session
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'organization',
          identifier: orgId,
          walletAddress: wallet,
          signature,
          challenge,
        }),
      })

      const verifyData = await verifyResponse.json()

      if (verifyData.success) {
        // Store organization session data
        sessionStorage.setItem('organizationId', orgId)
        sessionStorage.setItem('walletAddress', wallet)
        sessionStorage.setItem('authenticated', 'true')
        sessionStorage.setItem('authType', 'organization')
        
        // Redirect to dashboard
        router.push('/organization/dashboard')
      } else {
        throw new Error('Authentication verification failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate')
    }
  }

  const handleSelectOrganization = async () => {
    if (!selectedOrg) return
    setLoading(true)
    try {
      await loginToOrganization(selectedOrg, walletAddress)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-vault-green/20 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-vault-green" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Organization Login</h1>
          <p className="text-vault-slate">
            Connect your wallet to access your organization dashboard
          </p>
        </motion.div>

        <Card className="bg-vault-darker border-vault-slate/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5 text-vault-green" />
              Wallet Authentication
            </CardTitle>
            <CardDescription>
              Secure login using your organization's admin wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            )}

            {organizations.length === 0 ? (
              <Button
                onClick={connectAndLogin}
                disabled={loading}
                className="w-full bg-vault-green hover:bg-vault-green/90 text-black font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-vault-slate mb-2 block">
                    Select Organization
                  </label>
                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <div
                        key={org.id}
                        onClick={() => setSelectedOrg(org.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedOrg === org.id
                            ? 'border-vault-green bg-vault-green/10'
                            : 'border-vault-slate/20 hover:border-vault-slate/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{org.name}</p>
                            <p className="text-xs text-vault-slate mt-1">
                              {org.employeeCount || 0} employees
                            </p>
                          </div>
                          {selectedOrg === org.id && (
                            <div className="w-5 h-5 bg-vault-green rounded-full flex items-center justify-center">
                              <Shield className="w-3 h-3 text-black" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSelectOrganization}
                  disabled={!selectedOrg || loading}
                  className="w-full bg-vault-green hover:bg-vault-green/90 text-black font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Login to Organization
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setOrganizations([])
                    setSelectedOrg('')
                    setWalletAddress('')
                    setError('')
                  }}
                  className="w-full text-vault-slate hover:text-white"
                >
                  Use Different Wallet
                </Button>
              </div>
            )}

            <div className="border-t border-vault-slate/20 pt-4">
              <p className="text-sm text-vault-slate text-center">
                Don't have an organization?{' '}
                <button
                  onClick={() => router.push('/organization/register')}
                  className="text-vault-green hover:underline"
                >
                  Register here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="mt-4 bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="text-xs text-blue-200/80">
                <p className="font-semibold mb-1 text-blue-100">Secure Authentication</p>
                <p>We never store your private keys. Authentication happens through cryptographic signature verification.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
