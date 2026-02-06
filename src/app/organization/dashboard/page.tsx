'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function OrganizationDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orgData, setOrgData] = useState<any>(null)
  const [organizationId, setOrganizationId] = useState<string>('')

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/login')
      return
    }
    setOrganizationId(orgId)
    loadDashboardData(orgId)
  }, [router])

  const loadDashboardData = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organization/status/${orgId}`)
      const data = await response.json()

      if (data.success) {
        setOrgData(data.organization)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-7xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-10 h-10 text-vault-green" />
              {orgData?.name || 'Organization Dashboard'}
            </h1>
            <p className="text-vault-slate mt-2">Manage your organization and employees</p>
          </div>
          <Badge className="bg-vault-green/20 text-vault-green">
            {orgData?.status || 'Active'}
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader className="pb-3">
                <CardDescription>Total Employees</CardDescription>
                <CardTitle className="text-3xl text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-400" />
                  {orgData?.employeeCount || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/organization/employees')}
                  variant="link"
                  className="p-0 h-auto text-vault-green hover:text-vault-green/80"
                >
                  View directory <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
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
                <CardDescription>Treasury Balance</CardDescription>
                <CardTitle className="text-3xl text-white flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-vault-green" />
                  ${orgData?.treasuryBalance?.toFixed(2) || '0.00'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/organization/treasury')}
                  variant="link"
                  className="p-0 h-auto text-vault-green hover:text-vault-green/80"
                >
                  Manage treasury <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
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
                <CardDescription>Available Auth Keys</CardDescription>
                <CardTitle className="text-3xl text-white flex items-center gap-2">
                  {orgData?.availableAuthKeys || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/organization/auth-keys')}
                  variant="link"
                  className="p-0 h-auto text-vault-green hover:text-vault-green/80"
                >
                  Manage keys <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader className="pb-3">
                <CardDescription>Monthly Payroll</CardDescription>
                <CardTitle className="text-3xl text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  ${orgData?.monthlyPayroll?.toFixed(2) || '0.00'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/organization/payroll')}
                  variant="link"
                  className="p-0 h-auto text-vault-green hover:text-vault-green/80"
                >
                  Run payroll <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <QuickActions userType="organization" />
        </motion.div>

        {/* Pending Items Alert */}
        {orgData?.pendingApprovals > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>
                  You have {orgData.pendingApprovals} external transaction(s) awaiting approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/admin/approvals')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Review Approvals
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription>Latest transactions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orgData?.recentActivity?.length > 0 ? (
                  orgData.recentActivity.map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-vault-dark rounded-lg border border-vault-slate/20"
                    >
                      <div>
                        <p className="text-white font-medium">{activity.description}</p>
                        <p className="text-sm text-vault-slate">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge className="bg-vault-green/20 text-vault-green">
                        {activity.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-vault-slate py-8">
                    No recent activity to display
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
