'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  ArrowLeft, 
  Loader2, 
  Mail,
  Wallet,
  DollarSign,
  Send,
  MoreVertical,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Employee {
  id: string
  nickname: string
  email: string
  walletAddress: string
  ensSubdomain: string
  jobTitle: string
  status: string
  balance: number
  joinedAt: string
}

export default function OrganizationEmployeesPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register')
      return
    }
    setOrganizationId(orgId)
    loadEmployees(orgId)
  }, [router])

  const loadEmployees = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organization/${orgId}/employees`)
      const data = await response.json()

      if (data.success) {
        setEmployees(data.employees)
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-6xl mx-auto px-4">
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
            <h1 className="text-4xl font-bold text-white mb-2">Employees</h1>
            <p className="text-vault-slate">Manage your team members</p>
          </div>
          <Badge className="bg-vault-green/20 text-vault-green border-vault-green/20">
            <Users className="w-3 h-3 mr-1" />
            {employees.length} Active
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-vault-green/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-vault-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{employees.length}</p>
                  <p className="text-sm text-vault-slate">Total Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {employees.filter((e) => e.status === 'active').length}
                  </p>
                  <p className="text-sm text-vault-slate">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${employees.reduce((sum, e) => sum + e.balance, 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-vault-slate">Total Balances</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-vault-darker border-vault-slate/20 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vault-slate" />
              <Input
                placeholder="Search employees by name, email, or job title..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="bg-vault-dark border-vault-slate/20 text-white pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        {filteredEmployees.length === 0 ? (
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-vault-slate mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No employees found' : 'No employees yet'}
              </h3>
              <p className="text-vault-slate">
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Employees will appear here once they complete onboarding'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-vault-darker border-vault-slate/20 hover:border-vault-green/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-vault-green/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-vault-green font-semibold text-lg">
                          {employee.nickname[0].toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-white font-semibold text-lg">{employee.nickname}</h3>
                          <Badge
                            className={
                              employee.status === 'active'
                                ? 'bg-vault-green/20 text-vault-green'
                                : 'bg-yellow-500/20 text-yellow-500'
                            }
                          >
                            {employee.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-vault-slate mb-2">{employee.jobTitle}</p>
                        <div className="flex items-center gap-4 text-sm text-vault-slate">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Wallet className="w-4 h-4" />
                            {employee.ensSubdomain}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Joined {new Date(employee.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="text-right">
                        <p className="text-sm text-vault-slate mb-1">Balance</p>
                        <p className="text-xl font-bold text-vault-green">
                          ${employee.balance.toFixed(2)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            // Quick pay flow
                            sessionStorage.setItem('quickPayRecipient', employee.ensSubdomain)
                            router.push('/organization/payroll')
                          }}
                          className="bg-vault-green/20 text-vault-green hover:bg-vault-green/30"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Pay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-vault-slate/20"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
