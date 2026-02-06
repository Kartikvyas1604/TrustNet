'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Loader2,
  ExternalLink,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PendingOrganization {
  id: string
  organizationName: string
  legalName: string
  organizationType: string
  country: string
  industry: string
  website?: string
  registrationNumber: string
  employeeCount: number
  tier: string
  totalCost: number
  billingCycle: string
  adminName: string
  adminEmail: string
  adminPhone: string
  adminJobTitle: string
  businessAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  kycDocuments: Array<{
    type: string
    url: string
    name: string
  }>
  walletAddress: string
  paymentStatus: string
  kycStatus: string
  createdAt: string
}

export default function AdminOrganizationApprovalPage() {
  const [organizations, setOrganizations] = useState<PendingOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState<PendingOrganization | null>(null)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    loadPendingOrganizations()
  }, [])

  const loadPendingOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations/pending')
      const data = await response.json()

      if (data.success) {
        setOrganizations(data.organizations)
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (orgId: string) => {
    if (!confirm('Are you sure you want to approve this organization? This will generate auth keys and deploy smart contracts.')) {
      return
    }

    setApproving(true)
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Organization approved! ${data.authKeysGenerated} auth keys generated.`)
        setSelectedOrg(null)
        loadPendingOrganizations()
      } else {
        alert('Approval failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async (orgId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setRejecting(true)
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Organization rejected. Email notification sent.')
        setSelectedOrg(null)
        setRejectionReason('')
        loadPendingOrganizations()
      } else {
        alert('Rejection failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setRejecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Organization Approvals</h1>
            <p className="text-vault-slate">Review and approve pending organization registrations</p>
          </div>
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            {organizations.length} Pending
          </Badge>
        </div>

        {organizations.length === 0 ? (
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-vault-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
              <p className="text-vault-slate">No pending organizations to review at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Organization List */}
            <div className="lg:col-span-1 space-y-4">
              {organizations.map((org) => (
                <motion.div
                  key={org.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      selectedOrg?.id === org.id
                        ? 'bg-vault-green/10 border-vault-green'
                        : 'bg-vault-darker border-vault-slate/20 hover:border-vault-green/50'
                    }`}
                    onClick={() => setSelectedOrg(org)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">{org.organizationName}</CardTitle>
                      <CardDescription>{org.legalName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-vault-slate">
                          <Building2 className="w-4 h-4" />
                          {org.organizationType}
                        </div>
                        <div className="flex items-center gap-2 text-vault-slate">
                          <Users className="w-4 h-4" />
                          {org.employeeCount} employees
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-vault-green/20 text-vault-green">
                            {org.tier}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              org.paymentStatus === 'paid'
                                ? 'border-vault-green text-vault-green'
                                : 'border-yellow-500 text-yellow-500'
                            }
                          >
                            {org.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Organization Details */}
            <div className="lg:col-span-2">
              {selectedOrg ? (
                <Card className="bg-vault-darker border-vault-slate/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-2xl mb-2">
                          {selectedOrg.organizationName}
                        </CardTitle>
                        <CardDescription className="text-base">
                          Registered {new Date(selectedOrg.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(selectedOrg.id)}
                          disabled={approving || rejecting}
                          className="bg-vault-green hover:bg-vault-green/90"
                        >
                          {approving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            const reason = prompt('Reason for rejection:')
                            if (reason) {
                              setRejectionReason(reason)
                              handleReject(selectedOrg.id)
                            }
                          }}
                          disabled={approving || rejecting}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="financial">Financial</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-6">
                        {/* Company Info */}
                        <div>
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-vault-green" />
                            Company Information
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-vault-slate mb-1">Legal Name</p>
                              <p className="text-white">{selectedOrg.legalName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-vault-slate mb-1">Registration Number</p>
                              <p className="text-white">{selectedOrg.registrationNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-vault-slate mb-1">Industry</p>
                              <p className="text-white">{selectedOrg.industry}</p>
                            </div>
                            <div>
                              <p className="text-sm text-vault-slate mb-1">Country</p>
                              <p className="text-white">{selectedOrg.country}</p>
                            </div>
                            {selectedOrg.website && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-vault-slate mb-1">Website</p>
                                <a
                                  href={selectedOrg.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-vault-green hover:underline flex items-center gap-1"
                                >
                                  {selectedOrg.website}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Business Address */}
                        <div>
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-vault-green" />
                            Business Address
                          </h3>
                          <div className="text-white">
                            <p>{selectedOrg.businessAddress.street}</p>
                            <p>
                              {selectedOrg.businessAddress.city}, {selectedOrg.businessAddress.state}{' '}
                              {selectedOrg.businessAddress.postalCode}
                            </p>
                            <p>{selectedOrg.businessAddress.country}</p>
                          </div>
                        </div>

                        {/* Admin Contact */}
                        <div>
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-vault-green" />
                            Administrator Contact
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-vault-slate mb-1">Name</p>
                              <p className="text-white">{selectedOrg.adminName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-vault-slate mb-1">Job Title</p>
                              <p className="text-white">{selectedOrg.adminJobTitle}</p>
                            </div>
                            <div>
                              <p className="text-sm text-vault-slate mb-1">Email</p>
                              <p className="text-white">{selectedOrg.adminEmail}</p>
                            </div>
                            <div>
                              <p className="text-sm text-vault-slate mb-1">Phone</p>
                              <p className="text-white">{selectedOrg.adminPhone}</p>
                            </div>
                          </div>
                        </div>

                        {/* Wallet */}
                        <div>
                          <h3 className="text-white font-semibold mb-3">Wallet Address</h3>
                          <code className="text-vault-green text-sm break-all">
                            {selectedOrg.walletAddress}
                          </code>
                        </div>
                      </TabsContent>

                      <TabsContent value="documents" className="space-y-4">
                        {selectedOrg.kycDocuments.map((doc, index) => (
                          <Card
                            key={index}
                            className="bg-vault-dark border-vault-slate/20"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-6 h-6 text-vault-green" />
                                  <div>
                                    <p className="text-white font-medium">{doc.name}</p>
                                    <p className="text-sm text-vault-slate capitalize">
                                      {doc.type.replace(/_/g, ' ')}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-vault-slate/20"
                                  onClick={() => window.open(doc.url, '_blank')}
                                >
                                  View
                                  <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>

                      <TabsContent value="financial" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-vault-green" />
                              Subscription Plan
                            </h3>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-vault-slate">Plan Tier</p>
                                <p className="text-white font-medium">{selectedOrg.tier}</p>
                              </div>
                              <div>
                                <p className="text-sm text-vault-slate">Employee Count</p>
                                <p className="text-white font-medium">{selectedOrg.employeeCount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-vault-slate">Billing Cycle</p>
                                <p className="text-white font-medium capitalize">
                                  {selectedOrg.billingCycle}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-vault-slate">Total Cost</p>
                                <p className="text-2xl font-bold text-vault-green">
                                  ${selectedOrg.totalCost}
                                  <span className="text-sm text-vault-slate">
                                    /{selectedOrg.billingCycle === 'annual' ? 'year' : 'month'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-white font-semibold mb-3">Payment Status</h3>
                            <Badge
                              className={
                                selectedOrg.paymentStatus === 'paid'
                                  ? 'bg-vault-green text-white'
                                  : 'bg-yellow-500 text-white'
                              }
                            >
                              {selectedOrg.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-vault-darker border-vault-slate/20">
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-16 h-16 text-vault-slate mx-auto mb-4 opacity-50" />
                    <p className="text-vault-slate">
                      Select an organization from the list to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
