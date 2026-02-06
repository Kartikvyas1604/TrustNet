'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Loader2, 
  ExternalLink,
  User,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PendingApproval {
  id: string
  employeeId: string
  employeeName: string
  employeeNickname: string
  toAddress: string
  amount: number
  token: string
  memo?: string
  createdAt: string
  employeeTransactionHistory: number
  employeeTenure: string
}

export default function AdminTransactionApprovalsPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register')
      return
    }
    setOrganizationId(orgId)
    loadPendingApprovals(orgId)

    // Poll for new approvals every 10 seconds
    const interval = setInterval(() => loadPendingApprovals(orgId), 10000)
    return () => clearInterval(interval)
  }, [router])

  const loadPendingApprovals = async (orgId: string) => {
    try {
      const response = await fetch(`/api/transactions/pending-approvals/${orgId}`)
      const data = await response.json()

      if (data.success) {
        setApprovals(data.approvals)
      }
    } catch (error) {
      console.error('Failed to load approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approvalId: string) => {
    if (!confirm('Approve this external transaction? Funds will be sent on-chain.')) {
      return
    }

    setProcessing(approvalId)
    try {
      const response = await fetch('/api/transactions/external/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId,
          organizationId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Transaction approved and executed successfully!')
        setSelectedApproval(null)
        loadPendingApprovals(organizationId)
      } else {
        alert('Approval failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (approvalId: string) => {
    const reason = prompt('Reason for rejection (will be sent to employee):')
    if (!reason) return

    setProcessing(approvalId)
    try {
      const response = await fetch('/api/transactions/external/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId,
          organizationId,
          reason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Transaction rejected. Funds unlocked and employee notified.')
        setSelectedApproval(null)
        loadPendingApprovals(organizationId)
      } else {
        alert('Rejection failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setProcessing(null)
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
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-vault-slate hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Transaction Approvals</h1>
            <p className="text-vault-slate">Review and approve external transactions</p>
          </div>
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            {approvals.length} Pending
          </Badge>
        </div>

        {approvals.length === 0 ? (
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-vault-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Clear!</h3>
              <p className="text-vault-slate">No pending transaction approvals at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Approval List */}
            <div className="lg:col-span-1 space-y-4">
              {approvals.map((approval) => (
                <motion.div
                  key={approval.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      selectedApproval?.id === approval.id
                        ? 'bg-vault-green/10 border-vault-green'
                        : 'bg-vault-darker border-vault-slate/20 hover:border-vault-green/50'
                    }`}
                    onClick={() => setSelectedApproval(approval)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-yellow-500/20 text-yellow-500">
                          External Transfer
                        </Badge>
                        <span className="text-xs text-vault-slate">
                          {new Date(approval.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <CardTitle className="text-white text-lg">
                        {approval.employeeNickname}
                      </CardTitle>
                      <CardDescription className="text-sm">{approval.employeeName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-vault-slate">Amount</span>
                          <span className="text-lg font-bold text-white">
                            ${approval.amount.toFixed(2)} {approval.token}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-vault-slate">To</span>
                          <code className="text-vault-green">
                            {approval.toAddress.slice(0, 6)}...{approval.toAddress.slice(-4)}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Approval Details */}
            <div className="lg:col-span-2">
              {selectedApproval ? (
                <Card className="bg-vault-darker border-vault-slate/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-2xl mb-2">
                          External Transfer Request
                        </CardTitle>
                        <CardDescription className="text-base">
                          Requested {new Date(selectedApproval.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(selectedApproval.id)}
                          disabled={processing === selectedApproval.id}
                          className="bg-vault-green hover:bg-vault-green/90"
                        >
                          {processing === selectedApproval.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(selectedApproval.id)}
                          disabled={processing === selectedApproval.id}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Transaction Details */}
                    <div>
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-vault-green" />
                        Transaction Details
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Amount</p>
                          <p className="text-2xl font-bold text-white">
                            ${selectedApproval.amount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Token</p>
                          <Badge className="bg-blue-500/20 text-blue-400">
                            {selectedApproval.token}
                          </Badge>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-vault-slate mb-1">Recipient Address</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-3 bg-vault-dark rounded-lg text-vault-green text-sm break-all">
                              {selectedApproval.toAddress}
                            </code>
                            <Button
                              size="icon"
                              variant="outline"
                              className="border-vault-slate/20"
                              onClick={() =>
                                window.open(`https://suiscan.xyz/mainnet/address/${selectedApproval.toAddress}`)
                              }
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {selectedApproval.memo && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-vault-slate mb-1">Memo</p>
                            <p className="text-white p-3 bg-vault-dark rounded-lg">
                              {selectedApproval.memo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Employee Context */}
                    <div>
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-vault-green" />
                        Employee Context
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Name</p>
                          <p className="text-white font-medium">{selectedApproval.employeeName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Nickname</p>
                          <p className="text-white font-medium">
                            {selectedApproval.employeeNickname}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-vault-slate mb-1">Tenure</p>
                          <p className="text-white font-medium">{selectedApproval.employeeTenure}</p>
                        </div>
                        <div className="md:col-span-3">
                          <p className="text-sm text-vault-slate mb-1">Transaction History</p>
                          <p className="text-white font-medium">
                            {selectedApproval.employeeTransactionHistory} previous transactions
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <Card className="bg-blue-500/10 border-blue-500/20">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-100">
                            <p className="font-semibold mb-1">Approval Guidelines:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-200/80">
                              <li>Verify the recipient address is legitimate</li>
                              <li>Check if the amount is reasonable for this employee</li>
                              <li>Review transaction history for unusual patterns</li>
                              <li>
                                Approved transactions are executed immediately and cannot be reversed
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-vault-darker border-vault-slate/20">
                  <CardContent className="p-12 text-center">
                    <Clock className="w-16 h-16 text-vault-slate mx-auto mb-4 opacity-50" />
                    <p className="text-vault-slate">
                      Select a pending approval from the list to review details
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
