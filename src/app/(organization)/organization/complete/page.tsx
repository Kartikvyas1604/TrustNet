'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'

function OrganizationCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('orgId')

  const [orgData, setOrgData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationStatus()
    }
  }, [organizationId])

  const fetchOrganizationStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/payment/status/${organizationId}`)
      const data = await response.json()
      if (data.success) {
        setOrgData(data.payment)
        
        // After showing the complete page briefly, redirect to pending
        setTimeout(() => {
          router.push('/organization/pending')
        }, 3000)
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Registration Complete!</h1>
          <p className="text-gray-600">
            Your organization has been successfully registered
          </p>
        </div>

        {/* Status Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">What's Next?</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-semibold">✅ Registration Completed</p>
                <p className="text-sm text-gray-600">Your organization information has been submitted</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-semibold">✅ Payment Received</p>
                <p className="text-sm text-gray-600">Your subscription payment has been confirmed</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-semibold">⏳ Admin Review Pending</p>
                <p className="text-sm text-gray-600">
                  Our team will review your documents within 24-48 hours
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-semibold">Organization Activation</p>
                <p className="text-sm text-gray-600">
                  Once approved, you'll receive an email to set up your organization wallet and start onboarding employees
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        {orgData && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-3">Subscription Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-semibold capitalize">{orgData.subscriptionStatus}</p>
              </div>
              <div>
                <p className="text-gray-500">Tier</p>
                <p className="font-semibold">{orgData.subscriptionTier}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment Status</p>
                <p className="font-semibold capitalize">{orgData.status}</p>
              </div>
              {orgData.nextBillingDate && (
                <div>
                  <p className="text-gray-500">Next Billing</p>
                  <p className="font-semibold">
                    {new Date(orgData.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Important Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> You will receive an email notification once your organization is approved. 
            Please check your inbox regularly and add our email to your contacts to avoid missing important updates.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={() => router.push('/organization/pending')}
            className="flex-1"
          >
            View Status
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>

        {/* Organization ID */}
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-500">Organization ID</p>
          <p className="font-mono text-sm font-semibold">{organizationId}</p>
          <p className="text-xs text-gray-400 mt-1">
            Please save this ID for future reference
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function OrganizationCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <OrganizationCompleteContent />
    </Suspense>
  )
}
