'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, ArrowRight, Loader2 } from 'lucide-react'

export default function EmployeeOnboardWalletPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'connect' | 'profile'>('connect')
  const [walletAddress, setWalletAddress] = useState('')
  const [organizationName, setOrganizationName] = useState('Organization')
  const [profileData, setProfileData] = useState({
    nickname: '',
    email: '',
    jobTitle: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrganizationName(sessionStorage.getItem('organizationName') || 'Organization')
    }
  }, [])

  const handleConnectWallet = async () => {
    setLoading(true)

    try {
      // In a real implementation, use wagmi/ethers to connect wallet
      // For now, we'll simulate wallet connection
      
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to continue')
        setLoading(false)
        return
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      if (!window.ethereum) {
        throw new Error('MetaMask disconnected')
      }
      
      const address = accounts[0]
      setWalletAddress(address)

      // Generate signature challenge
      const tempToken = sessionStorage.getItem('tempToken')
      const response = await fetch('/api/employee/connect-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          walletAddress: address,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Sign message
        if (!window.ethereum) {
          throw new Error('MetaMask not available')
        }
        const message = data.data.challenge.message
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        })

        // Verify signature
        const verifyResponse = await fetch('/api/employee/verify-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tempToken,
            walletAddress: address,
            signature,
            message,
          }),
        })

        const verifyData = await verifyResponse.json()

        if (verifyData.success) {
          setStep('profile')
        } else {
          alert(verifyData.error || 'Signature verification failed')
        }
      } else {
        alert(data.error || 'Wallet connection failed')
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      alert(error.message || 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleCompleteOnboarding = async () => {
    if (!profileData.nickname) {
      alert('Please enter a nickname')
      return
    }

    setLoading(true)

    try {
      const tempToken = sessionStorage.getItem('tempToken')
      const response = await fetch('/api/employee/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          walletAddress,
          ...profileData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.setItem('employeeId', data.data.employeeId)
        sessionStorage.setItem('ensName', data.data.ensName)
        
        // Show processing screen
        router.push('/employee/onboard/processing')
      } else {
        alert(data.error || 'Onboarding failed')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('An error occurred during onboarding')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-vault-bg text-vault-text flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold mb-4">Complete Your Profile</h1>
            <p className="text-vault-slate text-lg">
              Tell us a bit about yourself
            </p>
          </motion.div>

          <Card className="p-8 border-vault-slate/20 bg-vault-slate/5">
            <div className="space-y-4">
              <div>
                <Label htmlFor="nickname">Nickname *</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  value={profileData.nickname}
                  onChange={handleProfileChange}
                  placeholder="What should we call you?"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title (optional)</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  value={profileData.jobTitle}
                  onChange={handleProfileChange}
                  placeholder="Software Engineer"
                />
              </div>

              <Button
                onClick={handleCompleteOnboarding}
                variant="cyber"
                disabled={loading || !profileData.nickname}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Onboarding <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-vault-green/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-vault-green" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-vault-slate text-lg mb-2">
            You&apos;re joining <span className="text-vault-green font-bold">{organizationName}</span>
          </p>
          <p className="text-vault-slate">
            This wallet will be your identity on TrustNet. Keep it secure.
          </p>
        </motion.div>

        <Card className="p-8 border-vault-slate/20 bg-vault-slate/5">
          <Button
            onClick={handleConnectWallet}
            variant="cyber"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect MetaMask
              </>
            )}
          </Button>

          <div className="mt-6 p-4 rounded-lg bg-vault-slate/10 border border-vault-slate/20">
            <p className="text-sm text-vault-slate">
              <strong className="text-white">Note:</strong> Make sure you have MetaMask installed.
              This wallet will be permanently linked to your employee account.
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/employee/login')}
            className="text-vault-slate"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  )
}
