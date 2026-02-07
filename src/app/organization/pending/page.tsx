'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Clock, CheckCircle, Mail, RefreshCw } from 'lucide-react'

export default function OrganizationPendingPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [orgData, setOrgData] = useState<any>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register/details')
      return
    }
    setOrganizationId(orgId)
    checkStatus(orgId)

    // Poll for status every 30 seconds
    const interval = setInterval(() => {
      checkStatus(orgId)
    }, 30000)

    return () => clearInterval(interval)
  }, [router])

  const checkStatus = async (orgId: string) => {
    try {
      setChecking(true)
      const response = await fetch(`/api/organization/status/${orgId}`)
      const data = await response.json()

      if (data.success) {
        setOrgData(data.organization)
        
        // If approved, redirect to dashboard
        if (data.organization?.kycStatus === 'APPROVED') {
          sessionStorage.setItem('organizationApproved', 'true')
          router.push('/organization/dashboard')
        }
      }
    } catch (error) {
      console.error('Failed to check status:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleRefresh = () => {
    if (organizationId) {
      checkStatus(organizationId)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-vault-darker border-vault-slate/20">
        {/* Animated Loading Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-vault-green/10 rounded-full mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-vault-green/20 border-t-vault-green animate-spin"></div>
            <Clock className="w-12 h-12 text-vault-green" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-white">Application Under Review</h1>
          <p className="text-vault-slate text-lg">
            Your organization registration is being reviewed by our admin team
          </p>
        </div>

        {/* Status Timeline */}
        <div className="bg-vault-dark/50 border border-vault-slate/20 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4 text-white">Registration Progress</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-vault-green text-vault-dark flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">✅ Registration Completed</p>
                <p className="text-sm text-vault-slate">Your organization information has been submitted</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-vault-green text-vault-dark flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">✅ Documents Uploaded</p>
                <p className="text-sm text-vault-slate">All required documents have been received</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-vault-green text-vault-dark flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">✅ Payment Confirmed</p>
                <p className="text-sm text-vault-slate">Your subscription payment has been processed</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-yellow-400">⏳ Admin Review In Progress</p>
                <p className="text-sm text-vault-slate">
                  Our compliance team is verifying your documents and information
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-vault-slate/30 text-vault-slate flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-semibold text-vault-slate">Organization Activation</p>
                <p className="text-sm text-vault-slate/70">
                  Access to dashboard and employee management features
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-5 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-400 mb-1">What happens next?</p>
              <ul className="text-sm text-vault-slate space-y-1">
                <li>• Our team will review your documents within 24-48 hours</li>
                <li>• You'll receive an email notification once approved</li>
                <li>• After approval, you can access your organization dashboard</li>
                <li>• You'll be able to set up wallets and onboard employees</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRefresh}
            disabled={checking}
            className="flex-1 bg-vault-green hover:bg-vault-green/90 text-vault-dark"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status Now
              </>
            )}
          </Button>
          
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="flex-1 border-vault-slate/20 hover:bg-vault-slate/10 text-white"
          >
            Back to Home
          </Button>
        </div>

        {/* Organization Info */}
        {orgData && (
          <div className="mt-6 pt-6 border-t border-vault-slate/20">
            <p className="text-sm text-vault-slate text-center">
              Organization: <span className="text-white font-semibold">{orgData.name}</span>
              <br />
              Status: <span className="text-yellow-400 font-semibold">{orgData.kycStatus}</span>
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
