'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowRight, Key, Wallet, Building2, User, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { walletService } from '@/lib/wallet'

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState<'role' | 'org-login' | 'employee-key'>('role')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Organization login
  const [orgEmail, setOrgEmail] = useState('')
  const [connecting, setConnecting] = useState(false)
  
  // Employee login
  const [authKey, setAuthKey] = useState('')
  
  const handleOrgLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!orgEmail) {
      setError('Please enter your organization email')
      return
    }

    try {
      setConnecting(true)
      
      // Connect wallet for verification
      const walletState = await walletService.connectWallet()
      
      if (!walletState.connected) {
        setError('Failed to connect wallet')
        return
      }

      // Verify organization exists and wallet is authorized
      const response = await fetch('http://localhost:5001/api/auth/organization/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: orgEmail,
          walletAddress: walletState.address,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store organization ID in session
        sessionStorage.setItem('organizationId', data.organizationId)
        sessionStorage.setItem('userType', 'organization')
        
        // Redirect to organization dashboard
        router.push('/organization/dashboard')
      } else {
        setError(data.error || 'Organization not found or wallet not authorized')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate')
    } finally {
      setConnecting(false)
    }
  }

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!authKey) {
      setError('Please enter your auth key')
      return
    }

    try {
      setLoading(true)
      
      // Verify auth key format (XXXX-XXXX-XXXX-XXXX)
      const keyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
      if (!keyRegex.test(authKey.toUpperCase())) {
        setError('Invalid auth key format. Use XXXX-XXXX-XXXX-XXXX')
        return
      }

      const response = await fetch('http://localhost:5001/api/employee/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey: authKey.toUpperCase() }),
      })

      const data = await response.json()

      if (data.success) {
        // Store auth data in session
        sessionStorage.setItem('employeeId', data.employeeId)
        sessionStorage.setItem('organizationId', data.organizationId)
        sessionStorage.setItem('userType', 'employee')
        sessionStorage.setItem('authKey', authKey.toUpperCase())
        
        // Check if employee has completed onboarding
        if (data.onboardingComplete) {
          router.push('/employee/dashboard')
        } else {
          router.push('/employee/onboard/wallet')
        }
      } else {
        setError(data.error || 'Invalid auth key')
      }
    } catch (err: any) {
      setError('Failed to verify auth key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 text-white flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-vault-green/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-6 relative z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="text-vault-green p-1 border border-vault-green/20 rounded-md bg-vault-green/5">
            <Shield size={20} />
          </div>
          <span className="font-bold tracking-tight">
            TrustNet <span className="text-vault-slate font-thin">AUTH</span>
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-md w-full">
          <AnimatePresence mode="wait">
            {step === 'role' && (
              <motion.div
                key="role"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
                  <p className="text-vault-slate">Select your account type to continue</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setStep('org-login')}
                    className="w-full text-left p-6 rounded-lg border border-vault-slate/20 hover:border-vault-green/50 bg-vault-darker hover:bg-vault-slate/10 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xl group-hover:text-vault-green transition-colors">
                        Organization Admin
                      </span>
                      <Building2 size={24} className="text-vault-slate group-hover:text-vault-green transition-colors" />
                    </div>
                    <p className="text-sm text-vault-slate">
                      Access your organization dashboard and manage employees
                    </p>
                  </button>

                  <button
                    onClick={() => setStep('employee-key')}
                    className="w-full text-left p-6 rounded-lg border border-vault-slate/20 hover:border-blue-500/50 bg-vault-darker hover:bg-vault-slate/10 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xl group-hover:text-blue-400 transition-colors">
                        Employee
                      </span>
                      <User size={24} className="text-vault-slate group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-sm text-vault-slate">
                      Login with your employee auth key
                    </p>
                  </button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-vault-slate">
                      New organization?{' '}
                      <Link href="/organization/register" className="text-vault-green hover:underline">
                        Register here
                      </Link>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'org-login' && (
              <motion.div
                key="org-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-vault-darker border-vault-slate/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Organization Login
                    </CardTitle>
                    <CardDescription>
                      Connect your wallet to access your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleOrgLogin} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-vault-slate mb-2 block">
                          Organization Email
                        </label>
                        <Input
                          type="email"
                          placeholder="admin@company.com"
                          value={orgEmail}
                          onChange={(e) => setOrgEmail(e.target.value)}
                          className="bg-vault-dark border-vault-slate/20 text-white"
                          required
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setStep('role')}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={connecting}
                          className="flex-1 bg-vault-green text-vault-dark hover:bg-vault-green/90"
                        >
                          {connecting ? (
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
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 'employee-key' && (
              <motion.div
                key="employee-key"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-vault-darker border-vault-slate/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Employee Login
                    </CardTitle>
                    <CardDescription>
                      Enter the auth key provided by your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEmployeeLogin} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-vault-slate mb-2 block">
                          Auth Key (XXXX-XXXX-XXXX-XXXX)
                        </label>
                        <Input
                          type="text"
                          placeholder="ABCD-1234-EFGH-5678"
                          value={authKey}
                          onChange={(e) => setAuthKey(e.target.value.toUpperCase())}
                          maxLength={19}
                          className="bg-vault-dark border-vault-slate/20 text-white font-mono text-center text-base"
                          required
                        />
                        <p className="text-xs text-vault-slate/70 mt-2">
                          Format: 16 characters separated by dashes (XXXX-XXXX-XXXX-XXXX)
                        </p>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setStep('role')}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              Login
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-vault-slate relative z-10">
        <p>Secured by zero-knowledge cryptography</p>
      </footer>
    </div>
  )
}
