'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { KeyRound, ArrowRight } from 'lucide-react'

export default function EmployeeLoginPage() {
  const router = useRouter()
  const [authCode, setAuthCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatAuthCode = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    // Add dashes every 4 characters
    const parts = []
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.slice(i, i + 4))
    }
    
    return parts.join('-').slice(0, 19) // Max length: XXXX-XXXX-XXXX-XXXX
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAuthCode(e.target.value)
    setAuthCode(formatted)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Allow keys between 14-19 characters (handles XXXX-XXXX-XXXX-XXX to XXXX-XXXX-XXXX-XXXX)
    const cleanedCode = authCode.replace(/-/g, '')
    if (cleanedCode.length < 12 || cleanedCode.length > 16) {
      setError('Please enter a complete auth code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/employee/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authCode }),
      })

      const data = await response.json()

      if (data.success) {
        // Store temp token and organization info
        sessionStorage.setItem('tempToken', data.data.tempToken)
        sessionStorage.setItem('organizationName', data.data.organizationName)
        sessionStorage.setItem('organizationId', data.data.organizationId)
        
        // Check if this is a returning employee
        if (data.data.isReturningEmployee && data.data.existingEmployeeId) {
          // Returning employee - log them in directly
          sessionStorage.setItem('employeeId', data.data.existingEmployeeId)
          router.push('/employee/dashboard')
        } else {
          // New employee - redirect to wallet connection
          router.push('/employee/onboard/wallet')
        }
      } else {
        setError(data.error || 'Invalid auth code')
      }
    } catch (error) {
      console.error('Auth code verification error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
            <KeyRound className="w-8 h-8 text-vault-green" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Employee Access</h1>
          <p className="text-vault-slate text-lg">
            Enter your organization access code to join TrustNet
          </p>
        </motion.div>

        <Card className="p-8 border-vault-slate/20 bg-vault-slate/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="authCode" className="block text-sm font-medium mb-2">
                Access Code
              </label>
              <Input
                id="authCode"
                type="text"
                value={authCode}
                onChange={handleChange}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="text-center text-xl tracking-wider font-mono"
                required
                maxLength={19}
              />
              <p className="text-xs text-vault-slate mt-2">
                Received this code from your employer? Enter it here to join.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="cyber"
              disabled={loading || authCode.replace(/-/g, '').length < 12}
              className="w-full"
            >
              {loading ? (
                'Verifying...'
              ) : (
                <>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-vault-slate/20 text-center">
            <p className="text-sm text-vault-slate">
              Don&apos;t have an access code?{' '}
              <a href="mailto:support@trustnet.com" className="text-vault-green hover:underline">
                Contact your administrator
              </a>
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-vault-slate"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
