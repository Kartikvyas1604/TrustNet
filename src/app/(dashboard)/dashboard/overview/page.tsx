'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Download,
  Wallet,
  Send,
  Clock,
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  ensName?: string
  employeeCount: number
  employeeLimit: number
  treasuryBalance: any
  kycStatus: string
}

interface Employee {
  id: string
  nickname: string
  ensName?: string
  organizationName: string
  balances: {
    onChain: string
    offChain: string
    total: string
  }
}

export default function UniversalDashboard() {
  const [userType, setUserType] = useState<'organization' | 'employee' | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Detect user type from session/auth
    const orgId = sessionStorage.getItem('organizationId')
    const employeeId = sessionStorage.getItem('employeeId')

    if (employeeId) {
      setUserType('employee')
      loadEmployeeData(employeeId)
    } else if (orgId) {
      setUserType('organization')
      loadOrganizationData(orgId)
    } else {
      setLoading(false)
    }
  }, [])

  const loadOrganizationData = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organization/status/${orgId}`)
      const data = await response.json()
      if (data.success) {
        setOrganization(data.data.organization)
      }
    } catch (error) {
      console.error('Failed to load organization data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeeData = async (empId: string) => {
    try {
      const response = await fetch(`/api/employee/profile/${empId}`)
      const data = await response.json()
      if (data.success) {
        setEmployee({
          id: data.data.employee.id,
          nickname: data.data.employee.nickname,
          ensName: data.data.employee.ensName,
          organizationName: data.data.employee.organization.name,
          balances: data.data.balances,
        })
      }
    } catch (error) {
      console.error('Failed to load employee data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-vault-bg text-vault-text flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vault-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-vault-slate">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userType || (!organization && !employee)) {
    return (
      <div className="min-h-screen bg-vault-bg text-vault-text flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-vault-slate mb-6">
            Please log in to access your dashboard
          </p>
          <Button variant="cyber" onClick={() => (window.location.href = '/')}>
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  // Organization Dashboard
  if (userType === 'organization' && organization) {
    const totalBalance = organization.treasuryBalance?.total || '0'
    const isApproved = organization.kycStatus === 'APPROVED'

    return (
      <div className="min-h-screen bg-vault-bg text-vault-text p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">{organization.name}</h1>
              <div className="flex items-center gap-3">
                {organization.ensName && (
                  <span className="text-vault-green font-mono">{organization.ensName}</span>
                )}
                <Badge
                  variant={isApproved ? 'default' : 'outline'}
                  className={isApproved ? 'bg-vault-green text-black' : ''}
                >
                  {isApproved ? '✓ Verified' : 'Pending Verification'}
                </Badge>
              </div>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Auth Keys
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 border-vault-slate/20 bg-vault-slate/5">
              <div className="flex items-center justify-between mb-4">
                <Users className="text-vault-green" />
                <TrendingUp className="text-vault-green h-4 w-4" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {organization.employeeCount}/{organization.employeeLimit}
              </div>
              <div className="text-sm text-vault-slate">Active Employees</div>
            </Card>

            <Card className="p-6 border-vault-slate/20 bg-vault-slate/5">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="text-vault-green" />
              </div>
              <div className="text-3xl font-bold mb-1">${totalBalance}</div>
              <div className="text-sm text-vault-slate">Treasury Balance</div>
            </Card>

            <Card className="p-6 border-vault-slate/20 bg-vault-slate/5">
              <div className="flex items-center justify-between mb-4">
                <ArrowUpRight className="text-vault-green" />
              </div>
              <div className="text-3xl font-bold mb-1">0</div>
              <div className="text-sm text-vault-slate">Total Transactions</div>
            </Card>

            <Card className="p-6 border-vault-slate/20 bg-vault-slate/5">
              <div className="flex items-center justify-between mb-4">
                <Clock className="text-vault-green" />
              </div>
              <div className="text-3xl font-bold mb-1">0</div>
              <div className="text-sm text-vault-slate">Pending Approvals</div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-vault-slate/20 bg-vault-slate/5 hover:border-vault-green/30 transition-colors cursor-pointer">
              <h3 className="text-xl font-bold mb-2">Run Payroll</h3>
              <p className="text-vault-slate mb-4">
                Distribute payments to all employees
              </p>
              <Button variant="cyber" className="w-full">
                Start Payroll <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            <Card className="p-6 border-vault-slate/20 bg-vault-slate/5 hover:border-vault-green/30 transition-colors cursor-pointer">
              <h3 className="text-xl font-bold mb-2">Fund Treasury</h3>
              <p className="text-vault-slate mb-4">Deposit USDC to organization wallet</p>
              <Button variant="outline" className="w-full">
                Deposit Funds
              </Button>
            </Card>

            <Card className="p-6 border-vault-slate/20 bg-vault-slate/5 hover:border-vault-green/30 transition-colors cursor-pointer">
              <h3 className="text-xl font-bold mb-2">Employee Directory</h3>
              <p className="text-vault-slate mb-4">View and manage all employees</p>
              <Button variant="outline" className="w-full">
                View Employees
              </Button>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Employee Dashboard
  if (userType === 'employee' && employee) {
    return (
      <div className="min-h-screen bg-vault-bg text-vault-text p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome, {employee.nickname}!</h1>
            <div className="flex items-center gap-3">
              <span className="text-vault-green font-mono">{employee.ensName}</span>
              <span className="text-vault-slate">•</span>
              <span className="text-vault-slate">{employee.organizationName}</span>
            </div>
          </div>

          {/* Balance Card */}
          <Card className="p-8 border-vault-slate/20 bg-vault-slate/5 mb-8">
            <div className="text-sm text-vault-slate mb-2">Total Balance</div>
            <div className="text-5xl font-bold mb-6">${employee.balances.total} <span className="text-2xl text-vault-slate">USDC</span></div>
            <div className="flex gap-6 mb-6">
              <div>
                <div className="text-sm text-vault-slate">On-Chain</div>
                <div className="text-xl font-bold">${employee.balances.onChain}</div>
              </div>
              <div>
                <div className="text-sm text-vault-slate">Off-Chain</div>
                <div className="text-xl font-bold">${employee.balances.offChain}</div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="cyber" className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                Send Payment
              </Button>
              <Button variant="outline" className="flex-1">
                <Wallet className="mr-2 h-4 w-4" />
                Receive
              </Button>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 border-vault-slate/20 bg-vault-slate/5">
              <h3 className="text-xl font-bold mb-2">Transaction History</h3>
              <p className="text-vault-slate mb-4">View all your transactions</p>
              <Button variant="outline" className="w-full">
                View History
              </Button>
            </Card>

            <Card className="p-6 border-vault-slate/20 bg-vault-slate/5">
              <h3 className="text-xl font-bold mb-2">Organization Directory</h3>
              <p className="text-vault-slate mb-4">Send payments to coworkers</p>
              <Button variant="outline" className="w-full">
                View Directory
              </Button>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return null
}
