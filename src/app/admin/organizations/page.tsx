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
  Shield,
  Download,
  AlertCircle,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Organization {
  id: string
  organizationId: string
  name: string
  legalBusinessName: string
  registrationNumber: string
  country: string
  businessAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  industry: string
  websiteUrl?: string
  adminName: string
  adminEmail: string
  adminPhone: string
  adminJobTitle: string
  kycStatus: string
  kycDocuments: any
  subscriptionTier: string
  employeeLimit: number
  organizationType: string
  adminWallets: any
  paymentStatus: string
  billingCycle: string
  monthlyPrice?: string
  annualPrice?: string
  createdAt: string
  employeeCount: number
}

export default function AdminOrganizationApprovalPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')

  useEffect(() => {
    loadOrganizations()
  }, [statusFilter])

  useEffect(() => {
    // Filter organizations based on search term
    if (searchTerm) {
      const filtered = organizations.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.legalBusinessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.country.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOrgs(filtered)
    } else {
      setFilteredOrgs(organizations)
    }
  }, [searchTerm, organizations])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const endpoint = statusFilter === 'PENDING' 
        ? '/api/admin/organizations?status=PENDING'
        : '/api/admin/organizations'
        
      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.success) {
        setOrganizations(data.organizations)
        setFilteredOrgs(data.organizations)
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedOrg) return
    
    if (!confirm('Are you sure you want to approve this organization? This will give them access to the platform.')) {
      return
    }

    setApproving(true)
    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: approvalNotes }),
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Organization approved successfully!')
        setSelectedOrg(null)
        setApprovalNotes('')
        loadOrganizations()
      } else {
        alert('❌ Approval failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message)
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!selectedOrg || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    if (!confirm('Are you sure you want to reject this organization? They will need to reapply.')) {
      return
    }

    setRejecting(true)
    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Organization rejected')
        setSelectedOrg(null)
        setRejectionReason('')
        loadOrganizations()
      } else {
        alert('Rejection failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setRejecting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
      case 'APPROVED':
        return 'bg-green-500/20 text-green-400 border-green-500/20'
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/20'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/20'
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
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Shield className="w-10 h-10 text-vault-green" />
              Admin Dashboard
            </h1>
            <p className="text-vault-slate">Review and manage organization registrations</p>
          </div>
          <div className="flex gap-3">
            <Badge className={statusFilter === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' : 'bg-vault-slate/20 text-vault-slate'}>
              <Clock className="w-3 h-3 mr-1" />
              {organizations.filter(o => o.kycStatus === 'PENDING').length} Pending
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              {organizations.filter(o => o.kycStatus === 'APPROVED').length} Approved
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vault-slate w-4 h-4" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-vault-darker border-vault-slate/20 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['PENDING', 'ALL', 'APPROVED', 'REJECTED'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status ? 'bg-vault-green' : 'border-vault-slate/20'}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {filteredOrgs.length === 0 ? (
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-vault-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Clear!</h3>
              <p className="text-vault-slate">
                {searchTerm ? 'No organizations match your search.' : 'No organizations found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Organization List */}
            <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredOrgs.map((org) => (
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
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getStatusColor(org.kycStatus)}>
                          {org.kycStatus}
                        </Badge>
                        <span className="text-xs text-vault-slate">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-white text-lg">{org.name}</CardTitle>
                      <CardDescription className="text-sm">{org.legalBusinessName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vault-slate">Country</span>
                          <span className="text-white">{org.country}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vault-slate">Tier</span>
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            {org.subscriptionTier}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vault-slate">Employees</span>
                          <span className="text-white">{org.employeeCount}</span>
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
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <CardTitle className="text-white text-2xl mb-2">
                          {selectedOrg.name}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {selectedOrg.legalBusinessName}
                        </CardDescription>
                        <Badge className={`mt-2 ${getStatusColor(selectedOrg.kycStatus)}`}>
                          {selectedOrg.kycStatus}
                        </Badge>
                      </div>
                      {selectedOrg.kycStatus === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleApprove}
                            disabled={approving || rejecting}
                            className="bg-vault-green hover:bg-vault-green/90"
                          >
                            {approving ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button
                            onClick={() => {/* Show reject modal */}}
                            disabled={approving || rejecting}
                            variant="destructive"
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Company Information */}
                    <div>
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-vault-green" />
                        Company Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Registration Number</p>
                          <p className="text-white font-medium">{selectedOrg.registrationNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Country</p>
                          <p className="text-white font-medium">{selectedOrg.country}</p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Industry</p>
                          <p className="text-white font-medium">{selectedOrg.industry}</p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Organization Type</p>
                          <p className="text-white font-medium">{selectedOrg.organizationType || 'N/A'}</p>
                        </div>
                        {selectedOrg.websiteUrl && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-vault-slate mb-1">Website</p>
                            <a
                              href={selectedOrg.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-vault-green hover:underline flex items-center gap-1"
                            >
                              {selectedOrg.websiteUrl}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <p className="text-sm text-vault-slate mb-1">Business Address</p>
                          <p className="text-white">
                            {selectedOrg.businessAddress.street}, {selectedOrg.businessAddress.city},{' '}
                            {selectedOrg.businessAddress.state} {selectedOrg.businessAddress.postalCode}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Contact */}
                    <div>
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-vault-green" />
                        Admin Contact
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Name</p>
                          <p className="text-white font-medium">{selectedOrg.adminName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Job Title</p>
                          <p className="text-white font-medium">{selectedOrg.adminJobTitle}</p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Email</p>
                          <p className="text-white font-medium">{selectedOrg.adminEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Phone</p>
                          <p className="text-white font-medium">{selectedOrg.adminPhone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Details */}
                    <div>
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-vault-green" />
                        Subscription Details
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Tier</p>
                          <Badge className="bg-blue-500/20 text-blue-400">
                            {selectedOrg.subscriptionTier}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Employee Limit</p>
                          <p className="text-white font-medium">{selectedOrg.employeeLimit}</p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Billing Cycle</p>
                          <p className="text-white font-medium">{selectedOrg.billingCycle}</p>
                        </div>
                        {selectedOrg.monthlyPrice && (
                          <div>
                            <p className="text-sm text-vault-slate mb-1">Monthly Price</p>
                            <p className="text-white font-medium">${selectedOrg.monthlyPrice}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Payment Status</p>
                          <Badge className={selectedOrg.paymentStatus === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                            {selectedOrg.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* KYC Documents */}
                    {selectedOrg.kycDocuments && (
                      <div>
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-vault-green" />
                          KYC Documents
                        </h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          {Array.isArray(selectedOrg.kycDocuments) ? (
                            selectedOrg.kycDocuments.map((doc: any, index: number) => (
                              doc && doc.url && (
                                <Button
                                  key={index}
                                  variant="outline"
                                  className="border-vault-slate/20 hover:border-vault-green justify-start"
                                  onClick={() => window.open(doc.url, '_blank')}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {doc.name || doc.type?.replace(/([A-Z_])/g, ' $1').trim() || `Document ${index + 1}`}
                                  <ExternalLink className="w-3 h-3 ml-auto" />
                                </Button>
                              )
                            ))
                          ) : (
                            Object.entries(selectedOrg.kycDocuments as Record<string, any>).map(([key, value]) => {
                              const url = typeof value === 'string' ? value : value?.url;
                              const name = typeof value === 'object' ? value?.name : key;
                              return url && (
                                <Button
                                  key={key}
                                  variant="outline"
                                  className="border-vault-slate/20 hover:border-vault-green justify-start"
                                  onClick={() => window.open(url, '_blank')}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {name?.replace(/([A-Z_])/g, ' $1').trim() || key.replace(/([A-Z_])/g, ' $1').trim()}
                                  <ExternalLink className="w-3 h-3 ml-auto" />
                                </Button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Approval Actions */}
                    {selectedOrg.kycStatus === 'PENDING' && (
                      <div className="border-t border-vault-slate/20 pt-6 space-y-4">
                        <div>
                          <label className="text-sm text-vault-slate mb-2 block">
                            Approval Notes (Optional)
                          </label>
                          <Textarea
                            placeholder="Add any notes about this approval..."
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            className="bg-vault-dark border-vault-slate/20 text-white"
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm text-vault-slate mb-2 block">
                            Rejection Reason (Required for rejection)
                          </label>
                          <Textarea
                            placeholder="Provide a detailed reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="bg-vault-dark border-vault-slate/20 text-white"
                            rows={3}
                          />
                        </div>

                        <Card className="bg-blue-500/10 border-blue-500/20">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-blue-100">
                                <p className="font-semibold mb-1">Review Guidelines:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-200/80">
                                  <li>Verify all business information and documents</li>
                                  <li>Check payment status is completed</li>
                                  <li>Ensure admin contact details are valid</li>
                                  <li>Approved organizations get immediate platform access</li>
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="flex gap-3 justify-end">
                          <Button
                            onClick={handleReject}
                            disabled={approving || rejecting || !rejectionReason.trim()}
                            variant="outline"
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                          >
                            {rejecting ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Reject Organization
                          </Button>
                          <Button
                            onClick={handleApprove}
                            disabled={approving || rejecting}
                            className="bg-vault-green hover:bg-vault-green/90"
                          >
                            {approving ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve Organization
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-vault-darker border-vault-slate/20">
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-16 h-16 text-vault-slate mx-auto mb-4 opacity-50" />
                    <p className="text-vault-slate">
                      Select an organization from the list to review details
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
}//       const data = await response.json()

//       if (data.success) {
//         alert(`Organization approved! ${data.authKeysGenerated} auth keys generated.`)
//         setSelectedOrg(null)
//         loadPendingOrganizations()
//       } else {
//         alert('Approval failed: ' + (data.error || 'Unknown error'))
//       }
//     } catch (error: any) {
//       alert('Error: ' + error.message)
//     } finally {
//       setApproving(false)
//     }
//   }

//   const handleReject = async (orgId: string) => {
//     if (!rejectionReason.trim()) {
//       alert('Please provide a reason for rejection')
//       return
//     }

//     setRejecting(true)
//     try {
//       const response = await fetch(`/api/admin/organizations/${orgId}/reject`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ reason: rejectionReason }),
//       })

//       const data = await response.json()

//       if (data.success) {
//         alert('Organization rejected. Email notification sent.')
//         setSelectedOrg(null)
//         setRejectionReason('')
//         loadPendingOrganizations()
//       } else {
//         alert('Rejection failed: ' + (data.error || 'Unknown error'))
//       }
//     } catch (error: any) {
//       alert('Error: ' + error.message)
//     } finally {
//       setRejecting(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
//         <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
//       <div className="container max-w-7xl mx-auto px-4">
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-4xl font-bold text-white mb-2">Organization Approvals</h1>
//             <p className="text-vault-slate">Review and approve pending organization registrations</p>
//           </div>
//           <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">
//             <Clock className="w-3 h-3 mr-1" />
//             {organizations.length} Pending
//           </Badge>
//         </div>

//         {organizations.length === 0 ? (
//           <Card className="bg-vault-darker border-vault-slate/20">
//             <CardContent className="p-12 text-center">
//               <CheckCircle className="w-16 h-16 text-vault-green mx-auto mb-4" />
//               <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
//               <p className="text-vault-slate">No pending organizations to review at this time.</p>
//             </CardContent>
//           </Card>
//         ) : (
//           <div className="grid lg:grid-cols-3 gap-6">
//             {/* Organization List */}
//             <div className="lg:col-span-1 space-y-4">
//               {organizations.map((org) => (
//                 <motion.div
//                   key={org.id}
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                 >
//                   <Card
//                     className={`cursor-pointer transition-all ${
//                       selectedOrg?.id === org.id
//                         ? 'bg-vault-green/10 border-vault-green'
//                         : 'bg-vault-darker border-vault-slate/20 hover:border-vault-green/50'
//                     }`}
//                     onClick={() => setSelectedOrg(org)}
//                   >
//                     <CardHeader className="pb-3">
//                       <CardTitle className="text-white text-lg">{org.organizationName}</CardTitle>
//                       <CardDescription>{org.legalName}</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-2 text-sm">
//                         <div className="flex items-center gap-2 text-vault-slate">
//                           <Building2 className="w-4 h-4" />
//                           {org.organizationType}
//                         </div>
//                         <div className="flex items-center gap-2 text-vault-slate">
//                           <Users className="w-4 h-4" />
//                           {org.employeeCount} employees
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Badge className="bg-vault-green/20 text-vault-green">
//                             {org.tier}
//                           </Badge>
//                           <Badge
//                             variant="outline"
//                             className={
//                               org.paymentStatus === 'paid'
//                                 ? 'border-vault-green text-vault-green'
//                                 : 'border-yellow-500 text-yellow-500'
//                             }
//                           >
//                             {org.paymentStatus}
//                           </Badge>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </motion.div>
//               ))}
//             </div>

//             {/* Organization Details */}
//             <div className="lg:col-span-2">
//               {selectedOrg ? (
//                 <Card className="bg-vault-darker border-vault-slate/20">
//                   <CardHeader>
//                     <div className="flex items-start justify-between">
//                       <div>
//                         <CardTitle className="text-white text-2xl mb-2">
//                           {selectedOrg.organizationName}
//                         </CardTitle>
//                         <CardDescription className="text-base">
//                           Registered {new Date(selectedOrg.createdAt).toLocaleDateString()}
//                         </CardDescription>
//                       </div>
//                       <div className="flex gap-2">
//                         <Button
//                           onClick={() => handleApprove(selectedOrg.id)}
//                           disabled={approving || rejecting}
//                           className="bg-vault-green hover:bg-vault-green/90"
//                         >
//                           {approving ? (
//                             <Loader2 className="w-4 h-4 animate-spin" />
//                           ) : (
//                             <>
//                               <CheckCircle className="w-4 h-4 mr-2" />
//                               Approve
//                             </>
//                           )}
//                         </Button>
//                         <Button
//                           onClick={() => {
//                             const reason = prompt('Reason for rejection:')
//                             if (reason) {
//                               setRejectionReason(reason)
//                               handleReject(selectedOrg.id)
//                             }
//                           }}
//                           disabled={approving || rejecting}
//                           variant="destructive"
//                         >
//                           <XCircle className="w-4 h-4 mr-2" />
//                           Reject
//                         </Button>
//                       </div>
//                     </div>
//                   </CardHeader>
//                   <CardContent>
//                     <Tabs defaultValue="details" className="w-full">
//                       <TabsList className="grid w-full grid-cols-3 mb-6">
//                         <TabsTrigger value="details">Details</TabsTrigger>
//                         <TabsTrigger value="documents">Documents</TabsTrigger>
//                         <TabsTrigger value="financial">Financial</TabsTrigger>
//                       </TabsList>

//                       <TabsContent value="details" className="space-y-6">
//                         {/* Company Info */}
//                         <div>
//                           <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
//                             <Building2 className="w-4 h-4 text-vault-green" />
//                             Company Information
//                           </h3>
//                           <div className="grid md:grid-cols-2 gap-4">
//                             <div>
//                               <p className="text-sm text-vault-slate mb-1">Legal Name</p>
//                               <p className="text-white">{selectedOrg.legalName}</p>
//                             </div>
//                             <div>
//                               <p className="text-sm text-vault-slate mb-1">Registration Number</p>
//                               <p className="text-white">{selectedOrg.registrationNumber}</p>
//                             </div>
//                             <div>
//                               <p className="text-sm text-vault-slate mb-1">Industry</p>
//                               <p className="text-white">{selectedOrg.industry}</p>
//                             </div>
//                             <div>
//                               <p className="text-sm text-vault-slate mb-1">Country</p>
//                               <p className="text-white">{selectedOrg.country}</p>
//                             </div>
//                             {selectedOrg.website && (
//                               <div className="md:col-span-2">
//                                 <p className="text-sm text-vault-slate mb-1">Website</p>
//                                 <a
//                                   href={selectedOrg.website}
//                                   target="_blank"
//                                   rel="noopener noreferrer"
//                                   className="text-vault-green hover:underline flex items-center gap-1"
//                                 >
//                                   {selectedOrg.website}
//                                   <ExternalLink className="w-3 h-3" />
//                                 </a>
//                               </div>
//                             )}
//                           </div>
//                         </div>

//                         {/* Business Address */}
//                         <div>
//                           <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
//                             <MapPin className="w-4 h-4 text-vault-green" />
//                             Business Address
//                           </h3>
//                           <div className="text-white">
//                             <p>{selectedOrg.businessAddress.street}</p>
//                             <p>
//                               {selectedOrg.businessAddress.city}, {selectedOrg.businessAddress.state}{' '}
//                               {selectedOrg.businessAddress.postalCode}
//                             </p>
//                             <p>{selectedOrg.businessAddress.country}</p>
//                           </div>
//                         </div>

//                         {/* Admin Contact */}
//                         <div>
//                           <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
//                             <Shield className="w-4 h-4 text-vault-green" />
//                             Administrator Contact
//                           </h3>
//                           <div className="grid md:grid-cols-2 gap-4">
//                             <div>
//                               <p className="text-sm text-vault-slate mb-1">Name</p>
//                               <p className="text-white">{selectedOrg.adminName}</p>
//                             </div>
//                             <div>
//                               <p className="text-sm text-vault-slate mb-1">Job Title</p>
//                               <p className="text-white">{selectedOrg.adminJobTitle}</p>
//                             </div>
//                             <div>
//                               <p className="text-sm text-vault-slate mb-1">Email</p>
//                               <p className="text-white">{selectedOrg.adminEmail}</p>
//                             </div>
//                             <div>
//                               <p className="text-sm text-vault-slate mb-1">Phone</p>
//                               <p className="text-white">{selectedOrg.adminPhone}</p>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Wallet */}
//                         <div>
//                           <h3 className="text-white font-semibold mb-3">Wallet Address</h3>
//                           <code className="text-vault-green text-sm break-all">
//                             {selectedOrg.walletAddress}
//                           </code>
//                         </div>
//                       </TabsContent>

//                       <TabsContent value="documents" className="space-y-4">
//                         {selectedOrg.kycDocuments.map((doc, index) => (
//                           <Card
//                             key={index}
//                             className="bg-vault-dark border-vault-slate/20"
//                           >
//                             <CardContent className="p-4">
//                               <div className="flex items-center justify-between">
//                                 <div className="flex items-center gap-3">
//                                   <FileText className="w-6 h-6 text-vault-green" />
//                                   <div>
//                                     <p className="text-white font-medium">{doc.name}</p>
//                                     <p className="text-sm text-vault-slate capitalize">
//                                       {doc.type.replace(/_/g, ' ')}
//                                     </p>
//                                   </div>
//                                 </div>
//                                 <Button
//                                   size="sm"
//                                   variant="outline"
//                                   className="border-vault-slate/20"
//                                   onClick={() => window.open(doc.url, '_blank')}
//                                 >
//                                   View
//                                   <ExternalLink className="w-3 h-3 ml-2" />
//                                 </Button>
//                               </div>
//                             </CardContent>
//                           </Card>
//                         ))}
//                       </TabsContent>

//                       <TabsContent value="financial" className="space-y-6">
//                         <div className="grid md:grid-cols-2 gap-6">
//                           <div>
//                             <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
//                               <DollarSign className="w-4 h-4 text-vault-green" />
//                               Subscription Plan
//                             </h3>
//                             <div className="space-y-2">
//                               <div>
//                                 <p className="text-sm text-vault-slate">Plan Tier</p>
//                                 <p className="text-white font-medium">{selectedOrg.tier}</p>
//                               </div>
//                               <div>
//                                 <p className="text-sm text-vault-slate">Employee Count</p>
//                                 <p className="text-white font-medium">{selectedOrg.employeeCount}</p>
//                               </div>
//                               <div>
//                                 <p className="text-sm text-vault-slate">Billing Cycle</p>
//                                 <p className="text-white font-medium capitalize">
//                                   {selectedOrg.billingCycle}
//                                 </p>
//                               </div>
//                               <div>
//                                 <p className="text-sm text-vault-slate">Total Cost</p>
//                                 <p className="text-2xl font-bold text-vault-green">
//                                   ${selectedOrg.totalCost}
//                                   <span className="text-sm text-vault-slate">
//                                     /{selectedOrg.billingCycle === 'annual' ? 'year' : 'month'}
//                                   </span>
//                                 </p>
//                               </div>
//                             </div>
//                           </div>

//                           <div>
//                             <h3 className="text-white font-semibold mb-3">Payment Status</h3>
//                             <Badge
//                               className={
//                                 selectedOrg.paymentStatus === 'paid'
//                                   ? 'bg-vault-green text-white'
//                                   : 'bg-yellow-500 text-white'
//                               }
//                             >
//                               {selectedOrg.paymentStatus}
//                             </Badge>
//                           </div>
//                         </div>
//                       </TabsContent>
//                     </Tabs>
//                   </CardContent>
//                 </Card>
//               ) : (
//                 <Card className="bg-vault-darker border-vault-slate/20">
//                   <CardContent className="p-12 text-center">
//                     <Building2 className="w-16 h-16 text-vault-slate mx-auto mb-4 opacity-50" />
//                     <p className="text-vault-slate">
//                       Select an organization from the list to view details
//                     </p>
//                   </CardContent>
//                 </Card>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
