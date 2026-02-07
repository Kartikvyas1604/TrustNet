'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Loader2, AlertCircle, Building2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function OrganizationLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string>('')
  const [orgId, setOrgId] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (!email || !orgId) {
        throw new Error('Please enter both email and organization ID')
      }

      // Call login endpoint
      const response = await fetch('/api/auth/organization/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, organizationId: orgId }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Store organization session data
      sessionStorage.setItem('organizationId', data.organizationId)
      sessionStorage.setItem('authenticated', 'true')
      sessionStorage.setItem('authType', 'organization')
      
      // Redirect to dashboard
      router.push('/organization/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to login')
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
            Enter your credentials to access your organization dashboard
          </p>
        </motion.div>

        <Card className="bg-vault-darker border-vault-slate/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-vault-green" />
              Secure Login
            </CardTitle>
            <CardDescription>
              Login with your organization credentials
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

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-vault-slate mb-2 block">
                  Admin Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-vault-dark border-vault-slate/20 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-vault-slate mb-2 block">
                  Organization ID
                </label>
                <Input
                  type="text"
                  placeholder="org_xxxxx"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="bg-vault-dark border-vault-slate/20 text-white font-mono"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-vault-green hover:bg-vault-green/90 text-black font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>

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
