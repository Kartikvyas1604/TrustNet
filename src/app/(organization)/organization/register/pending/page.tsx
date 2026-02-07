'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, Mail, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export default function OrganizationPendingPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [status, setStatus] = useState<ApprovalStatus>('pending')
  const [loading, setLoading] = useState(true)
  const [orgData, setOrgData] = useState<any>(null)

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register')
      return
    }
    setOrganizationId(orgId)

    // Poll for approval status
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/organization/status/${orgId}`)
        const data = await response.json()

        if (data.success) {
          setOrgData(data.organization)
          
          if (data.organization.approvalStatus === 'approved') {
            setStatus('approved')
            setLoading(false)
            // Auto-redirect after 3 seconds
            setTimeout(() => {
              router.push('/organization/dashboard')
            }, 3000)
          } else if (data.organization.approvalStatus === 'rejected') {
            setStatus('rejected')
            setLoading(false)
          } else {
            setStatus('pending')
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Status check failed:', error)
        setLoading(false)
      }
    }

    // Initial check
    pollStatus()

    // Poll every 10 seconds
    const interval = setInterval(pollStatus, 10000)

    return () => clearInterval(interval)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex mb-4"
          >
            {status === 'pending' && (
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
            )}
            {status === 'approved' && (
              <div className="w-20 h-20 rounded-full bg-vault-green/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-vault-green" />
              </div>
            )}
            {status === 'rejected' && (
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
            )}
          </motion.div>

          {status === 'pending' && (
            <>
              <h1 className="text-4xl font-bold text-white mb-2">Application Under Review</h1>
              <p className="text-vault-slate">
                Your organization registration is being reviewed by our team
              </p>
            </>
          )}

          {status === 'approved' && (
            <>
              <h1 className="text-4xl font-bold text-white mb-2">Welcome to TrustNet!</h1>
              <p className="text-vault-slate">
                Your organization has been approved. Setting up your account...
              </p>
            </>
          )}

          {status === 'rejected' && (
            <>
              <h1 className="text-4xl font-bold text-white mb-2">Application Declined</h1>
              <p className="text-vault-slate">
                Unfortunately, we couldn't approve your application at this time
              </p>
            </>
          )}
        </div>

        {/* Status Card */}
        {status === 'pending' && (
          <Card className="bg-vault-darker border-vault-slate/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white">What Happens Next?</CardTitle>
              <CardDescription>Typical verification timeline: 1-3 business days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-vault-green/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-vault-green font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Document Verification</h3>
                    <p className="text-sm text-vault-slate">
                      Our compliance team is reviewing your KYC documents
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-vault-slate/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-vault-slate font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Background Checks</h3>
                    <p className="text-sm text-vault-slate">
                      Standard business verification and regulatory compliance checks
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-vault-slate/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-vault-slate font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Payment Confirmation</h3>
                    <p className="text-sm text-vault-slate">
                      Verifying your subscription payment and activating your account
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-vault-slate/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-vault-slate font-semibold text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Contract Deployment</h3>
                    <p className="text-sm text-vault-slate">
                      Deploying your organization's smart contracts on Sui blockchain
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-vault-green/10 border-vault-green mb-8">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-white text-lg font-semibold mb-2">
                    Your organization is ready!
                  </h3>
                  <p className="text-vault-slate mb-4">
                    Redirecting to your dashboard in a few seconds...
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard/overview')}
                    className="bg-vault-green hover:bg-vault-green/90"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {orgData && orgData.authKeys && (
              <Card className="bg-vault-darker border-vault-slate/20">
                <CardHeader>
                  <CardTitle className="text-white">Your Setup Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-vault-slate mb-2">Organization ID:</p>
                    <code className="text-vault-green text-sm">{organizationId}</code>
                  </div>
                  <div>
                    <p className="text-sm text-vault-slate mb-2">
                      Employee Auth Keys Generated:
                    </p>
                    <Badge className="bg-vault-green text-white">
                      {orgData.authKeys.length} keys ready
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {status === 'rejected' && orgData?.rejectionReason && (
          <Card className="bg-red-500/10 border-red-500/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Reason for Decline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200">{orgData.rejectionReason}</p>
            </CardContent>
          </Card>
        )}

        {/* Contact Support */}
        <Card className="bg-vault-darker border-vault-slate/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-vault-green flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Need Help?</h3>
                <p className="text-sm text-vault-slate mb-3">
                  If you have questions about your application status, please contact our support team.
                </p>
                <Button variant="outline" size="sm" className="border-vault-slate/20">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
