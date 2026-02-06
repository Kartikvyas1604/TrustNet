'use client'

import { useRouter } from 'next/navigation'
import { 
  DollarSign, 
  Users, 
  Settings, 
  Key, 
  Send, 
  Download, 
  History, 
  User,
  Wallet,
  Building2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QuickActionsProps {
  userType: 'organization' | 'employee' | 'admin'
}

export function QuickActions({ userType }: QuickActionsProps) {
  const router = useRouter()

  const organizationActions = [
    {
      title: 'Run Payroll',
      description: 'Execute batch payments to employees',
      icon: DollarSign,
      path: '/organization/payroll',
      color: 'text-vault-green'
    },
    {
      title: 'Manage Treasury',
      description: 'View balances and deposit addresses',
      icon: Wallet,
      path: '/organization/treasury',
      color: 'text-blue-400'
    },
    {
      title: 'Employee Directory',
      description: 'View and manage all employees',
      icon: Users,
      path: '/organization/employees',
      color: 'text-purple-400'
    },
    {
      title: 'Auth Keys',
      description: 'Generate employee onboarding keys',
      icon: Key,
      path: '/organization/auth-keys',
      color: 'text-yellow-400'
    },
    {
      title: 'Settings',
      description: 'Configure organization details',
      icon: Settings,
      path: '/organization/settings',
      color: 'text-vault-slate'
    }
  ]

  const employeeActions = [
    {
      title: 'Send Payment',
      description: 'Transfer funds to colleagues or external wallets',
      icon: Send,
      path: '/employee/send',
      color: 'text-vault-green'
    },
    {
      title: 'Receive Funds',
      description: 'View your payment addresses',
      icon: Download,
      path: '/employee/receive',
      color: 'text-blue-400'
    },
    {
      title: 'Transaction History',
      description: 'View all past transactions',
      icon: History,
      path: '/employee/transactions',
      color: 'text-purple-400'
    },
    {
      title: 'Profile',
      description: 'Update your personal information',
      icon: User,
      path: '/employee/profile',
      color: 'text-yellow-400'
    }
  ]

  const adminActions = [
    {
      title: 'Organization Approvals',
      description: 'Review pending organization registrations',
      icon: Building2,
      path: '/admin/organizations',
      color: 'text-vault-green'
    },
    {
      title: 'Transaction Approvals',
      description: 'Approve/reject external transactions',
      icon: History,
      path: '/admin/approvals',
      color: 'text-blue-400'
    }
  ]

  const getActions = () => {
    switch (userType) {
      case 'organization':
        return organizationActions
      case 'employee':
        return employeeActions
      case 'admin':
        return adminActions
      default:
        return []
    }
  }

  const actions = getActions()

  return (
    <Card className="bg-vault-darker border-vault-slate/20">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
        <CardDescription>
          {userType === 'organization' && 'Manage your organization and employees'}
          {userType === 'employee' && 'Access your wallet and transactions'}
          {userType === 'admin' && 'Review and approve pending items'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Button
              key={action.path}
              onClick={() => router.push(action.path)}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 border-vault-slate/20 hover:bg-vault-dark hover:border-vault-green transition-all"
            >
              <action.icon className={`w-6 h-6 ${action.color}`} />
              <div className="text-left">
                <div className="font-semibold text-white">{action.title}</div>
                <div className="text-xs text-vault-slate mt-1">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
