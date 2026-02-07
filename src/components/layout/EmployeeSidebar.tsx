'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Shield, 
  LayoutDashboard, 
  Send, 
  Download, 
  History, 
  User, 
  LogOut,
  Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/employee/dashboard' },
  { icon: Send, label: 'Send Payment', href: '/employee/send' },
  { icon: Download, label: 'Receive', href: '/employee/receive' },
  { icon: History, label: 'Transactions', href: '/employee/transactions' },
  { icon: User, label: 'Profile', href: '/employee/profile' },
]

export function EmployeeSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [employeeName, setEmployeeName] = useState('Employee')
  const [orgName, setOrgName] = useState('Organization')
  const [balance, setBalance] = useState('0.00')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEmployeeData = async () => {
      const employeeId = sessionStorage.getItem('employeeId')
      if (!employeeId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/employee/profile/${employeeId}`)
        const data = await response.json()

        if (data.success && data.employee) {
          setEmployeeName(data.employee.nickname || 'Employee')
          setOrgName(data.employee.organizationName || 'Organization')
          
          // Calculate total balance
          const total = (parseFloat(data.balances?.onChain || '0') + 
                        parseFloat(data.balances?.offChain || '0')).toFixed(2)
          setBalance(total)
        }
      } catch (error) {
        console.error('Failed to load employee data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEmployeeData()
  }, [])

  const handleLogout = () => {
    sessionStorage.clear()
    router.push('/employee/login')
  }

  return (
    <aside className="w-64 border-r border-vault-slate/20 bg-vault-bg flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-vault-slate/20 flex items-center gap-3">
         <div className="text-vault-green p-1 border border-vault-green/20 rounded-md bg-vault-green/5">
            <Shield size={20} />
         </div>
         <span className="font-bold tracking-tight text-white">TrustNet <span className="font-thin text-vault-slate">EMP</span></span>
      </div>

      <div className="p-4 flex-1 space-y-1 overflow-y-auto">
        {/* Employee Info */}
        <div className="mb-6 px-2">
            <p className="text-[10px] text-vault-slate uppercase tracking-wider font-mono mb-2">Employee</p>
            <div className="p-3 rounded-md bg-vault-slate/5 border border-vault-slate/10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-vault-green/20 flex items-center justify-center text-xs font-bold text-vault-green">
                      {loading ? '...' : employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <div className="text-sm font-bold truncate" title={employeeName}>
                          {loading ? 'Loading...' : employeeName}
                        </div>
                        <div className="text-[10px] text-vault-slate truncate" title={orgName}>
                          {loading ? '...' : orgName}
                        </div>
                    </div>
                </div>
                <div className="pt-2 border-t border-vault-slate/10">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-vault-slate font-mono uppercase">Balance</span>
                        <span className="text-sm text-vault-green font-bold">${balance}</span>
                    </div>
                </div>
            </div>
        </div>

        <p className="text-[10px] text-vault-slate uppercase tracking-wider font-mono px-2 mb-2">Navigation</p>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group relative mb-1",
                  isActive 
                    ? "bg-vault-green/10 text-vault-green font-medium" 
                    : "text-vault-slate hover:text-white hover:bg-vault-slate/5"
                )}
              >
                {isActive && (
                    <motion.div 
                        layoutId="activeNav"
                        className="absolute left-0 w-1 h-full bg-vault-green rounded-r-full"
                    />
                )}
                <item.icon size={18} className={isActive ? "text-vault-green" : "text-vault-slate group-hover:text-white"} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-vault-slate/20">
         <div className="mb-4 bg-vault-slate/5 rounded-md p-3 border border-vault-slate/10">
            <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-vault-green" />
                <span className="text-[10px] text-vault-slate font-mono uppercase">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Link href="/employee/send">
                    <Button size="sm" variant="outline" className="w-full text-xs border-vault-slate/20">
                        Send
                    </Button>
                </Link>
                <Link href="/employee/receive">
                    <Button size="sm" variant="outline" className="w-full text-xs border-vault-slate/20">
                        Receive
                    </Button>
                </Link>
            </div>
         </div>
         <Button 
            variant="ghost" 
            className="w-full justify-start text-vault-slate hover:text-red-400 hover:bg-red-900/10"
            onClick={handleLogout}
         >
            <LogOut size={16} className="mr-2" /> Logout
         </Button>
      </div>
    </aside>
  )
}
