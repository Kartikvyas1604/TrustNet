'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, 
  ArrowLeft, 
  Loader2, 
  Mail,
  Wallet,
  Briefcase,
  Calendar,
  Save,
  Shield,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function EmployeeProfilePage() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employeeData, setEmployeeData] = useState<any>(null)

  useEffect(() => {
    const empId = sessionStorage.getItem('employeeId')
    if (!empId) {
      router.push('/employee/login')
      return
    }
    setEmployeeId(empId)
    loadEmployeeData(empId)
  }, [router])

  const loadEmployeeData = async (empId: string) => {
    try {
      const response = await fetch(`/api/employee/profile/${empId}`)
      
      if (!response.ok) {
        console.error('Failed to fetch profile:', response.status)
        setLoading(false)
        return
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response for profile')
        setLoading(false)
        return
      }
      
      const data = await response.json()

      if (data.success) {
        setEmployeeData(data.employee)
      }
    } catch (error) {
      console.error('Failed to load employee data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/employee/${employeeId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: employeeData.nickname,
          email: employeeData.email,
          jobTitle: employeeData.jobTitle,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      sessionStorage.clear()
      router.push('/employee/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  if (!employeeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <p className="text-vault-slate">Employee profile not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-vault-slate hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-vault-green/20 flex items-center justify-center">
              <span className="text-vault-green font-bold text-2xl">
                {employeeData.nickname[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">{employeeData.nickname}</h1>
              <p className="text-vault-slate">{employeeData.jobTitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-vault-green hover:bg-vault-green/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-vault-slate/20 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-vault-green" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nickname</Label>
                  <Input
                    value={employeeData.nickname || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmployeeData({ ...employeeData, nickname: e.target.value })
                    }
                    className="bg-vault-dark border-vault-slate/20 text-white"
                  />
                  <p className="text-xs text-vault-slate mt-1">
                    Used for ENS subdomain and internal payments
                  </p>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={employeeData.email || ''}
                    onChange={(e) =>
                      setEmployeeData({ ...employeeData, email: e.target.value })
                    }
                    className="bg-vault-dark border-vault-slate/20 text-white"
                  />
                </div>

                <div>
                  <Label>Job Title</Label>
                  <Input
                    value={employeeData.jobTitle || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmployeeData({ ...employeeData, jobTitle: e.target.value })
                    }
                    className="bg-vault-dark border-vault-slate/20 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-vault-green" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-vault-slate">Member Since</span>
                  <span className="text-white">
                    {new Date(employeeData.joinedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vault-slate">Account Status</span>
                  <Badge className="bg-vault-green/20 text-vault-green">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-vault-slate">Total Transactions</span>
                  <span className="text-white">{employeeData.transactionCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-vault-green" />
                  Wallet Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-vault-slate">Sui Wallet Address</Label>
                  <code className="block p-3 bg-vault-dark rounded-lg text-vault-green text-sm mt-2 break-all">
                    {employeeData.walletAddress}
                  </code>
                </div>

                <div>
                  <Label className="text-vault-slate">ENS Subdomain</Label>
                  <code className="block p-3 bg-vault-dark rounded-lg text-vault-green text-sm mt-2">
                    {employeeData.ensSubdomain}
                  </code>
                  <p className="text-xs text-vault-slate mt-1">
                    Use this for internal payments - instant & free
                  </p>
                </div>

                <div>
                  <Label className="text-vault-slate">Wallet Type</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-500/20 text-blue-400">Child Wallet</Badge>
                    <span className="text-sm text-vault-slate">
                      Derived from organization parent wallet
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-vault-slate/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-vault-slate mb-1">Yellow Network Channel</p>
                      <Badge className="bg-vault-green/20 text-vault-green">Active</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-vault-slate mb-1">Off-chain Balance</p>
                      <p className="text-xl font-bold text-white">
                        ${employeeData.offChainBalance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-vault-green" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-vault-slate">
                  <li className="flex items-start gap-2">
                    <span className="text-vault-green">✓</span>
                    <span>
                      Parent-controlled: Organization must approve external transactions
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-vault-green">✓</span>
                    <span>Internal transfers are instant and gas-free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-vault-green">✓</span>
                    <span>ZK proofs protect your transaction privacy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-vault-green">✓</span>
                    <span>Multi-chain support via cross-chain bridges</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-vault-green" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-vault-slate">Organization</span>
                  <span className="text-white font-medium">{employeeData.organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vault-slate">Total Employees</span>
                  <span className="text-white">{employeeData.totalEmployees || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vault-slate">Your Job Title</span>
                  <span className="text-white">{employeeData.jobTitle}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push('/organization/employees')}
                  variant="outline"
                  className="w-full border-vault-slate/20"
                >
                  View All Employees
                </Button>
                <Button
                  onClick={() => router.push('/employee/send')}
                  variant="outline"
                  className="w-full border-vault-slate/20"
                >
                  Send Payment to Colleague
                </Button>
                <Button
                  onClick={() => router.push('/employee/transactions')}
                  variant="outline"
                  className="w-full border-vault-slate/20"
                >
                  View Transaction History
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
