'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Loader2,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [employeeId, setEmployeeId] = useState<string>('')

  useEffect(() => {
    const empId = sessionStorage.getItem('employeeId')
    if (!empId) {
      // Layout will handle redirect, just don't load data
      return
    }
    setEmployeeId(empId)
    loadDashboardData(empId)
  }, [router])

  const loadDashboardData = async (empId: string) => {
    try {
      const response = await fetch(`/api/employee/profile/${empId}`)
      
      if (!response.ok) {
        console.error('Failed to fetch employee profile:', response.status)
        setLoading(false)
        return
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response for employee profile')
        setLoading(false)
        return
      }
      
      const data = await response.json()

      if (data.success) {
        setEmployeeData(data.employee)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  const totalBalance = (employeeData?.onChainBalance || 0) + (employeeData?.offChainBalance || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-7xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <User className="w-10 h-10 text-vault-green" />
              Welcome, {employeeData?.nickname || 'Employee'}
            </h1>
            <p className="text-vault-slate mt-2">{employeeData?.jobTitle || 'Employee'} at {employeeData?.organizationName || 'Organization'}</p>
          </div>
          <Button
            onClick={() => router.push('/employee/profile')}
            variant="outline"
            className="border-vault-slate/20"
          >
            View Profile
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <Card className="bg-gradient-to-br from-vault-green/20 to-vault-green/5 border-vault-green/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-vault-green/80">Total Balance</CardDescription>
                <CardTitle className="text-5xl text-white flex items-center gap-3">
                  <Wallet className="w-8 h-8 text-vault-green" />
                  ${totalBalance.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-vault-slate">On-chain (Sui)</span>
                  <span className="text-white">${(employeeData?.onChainBalance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vault-slate">Off-chain (Yellow)</span>
                  <span className="text-white">${(employeeData?.offChainBalance || 0).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader className="pb-3">
                <CardDescription>Total Sent</CardDescription>
                <CardTitle className="text-3xl text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-red-400" />
                  ${(employeeData?.totalSent || 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-vault-slate">
                  {employeeData?.sentCount || 0} transactions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader className="pb-3">
                <CardDescription>Total Received</CardDescription>
                <CardTitle className="text-3xl text-white flex items-center gap-2">
                  <TrendingDown className="w-6 h-6 text-vault-green" />
                  ${(employeeData?.totalReceived || 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-vault-slate">
                  {employeeData?.receivedCount || 0} transactions
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <QuickActions userType="employee" />
        </motion.div>

        {/* Wallet Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardHeader>
              <CardTitle className="text-white">Your Wallet Details</CardTitle>
              <CardDescription>Use these addresses to receive payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-vault-slate text-sm">ENS Subdomain (Internal Payments)</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 p-3 bg-vault-dark rounded-lg text-vault-green text-sm">
                    {employeeData?.ensSubdomain || 'Not assigned'}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/employee/receive')}
                    className="border-vault-slate/20"
                  >
                    View
                  </Button>
                </div>
                <Badge className="bg-vault-green/20 text-vault-green mt-2">
                  Instant & Free
                </Badge>
              </div>

              <div>
                <Label className="text-vault-slate text-sm">Sui Wallet Address (External Payments)</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 p-3 bg-vault-dark rounded-lg text-vault-green text-sm break-all">
                    {employeeData?.walletAddress || 'Not connected'}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/employee/receive')}
                    className="border-vault-slate/20"
                  >
                    View
                  </Button>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-500 mt-2">
                  Requires Approval
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Recent Transactions</CardTitle>
                  <CardDescription>Your latest payment activity</CardDescription>
                </div>
                <Button
                  onClick={() => router.push('/employee/transactions')}
                  variant="outline"
                  size="sm"
                  className="border-vault-slate/20"
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeData?.recentTransactions?.length > 0 ? (
                  employeeData.recentTransactions.slice(0, 5).map((tx: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-vault-dark rounded-lg border border-vault-slate/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'sent' ? 'bg-red-500/20' : 'bg-vault-green/20'
                        }`}>
                          {tx.type === 'sent' ? (
                            <TrendingUp className="w-5 h-5 text-red-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-vault-green" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {tx.type === 'sent' ? 'Sent to' : 'Received from'} {tx.counterparty}
                          </p>
                          <p className="text-sm text-vault-slate">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'sent' ? 'text-red-400' : 'text-vault-green'}`}>
                          {tx.type === 'sent' ? '-' : '+'}${tx.amount.toFixed(2)}
                        </p>
                        <Badge className={
                          tx.status === 'confirmed' 
                            ? 'bg-vault-green/20 text-vault-green' 
                            : 'bg-yellow-500/20 text-yellow-500'
                        }>
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-vault-slate py-8">
                    No transactions yet. Send or receive your first payment!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
