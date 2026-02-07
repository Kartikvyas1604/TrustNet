'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Shield, LayoutDashboard, Send, FileText, Settings, LogOut, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Send, label: 'Private Transfer', href: '/dashboard/transfer' },
  { icon: Users, label: 'Employee Grid', href: '/dashboard/employees' },
  { icon: Activity, label: 'Network Status', href: '/dashboard/network' },
  { icon: FileText, label: 'Compliance & Audit', href: '/dashboard/audit' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [orgName, setOrgName] = useState('Organization')
  const [orgInitials, setOrgInitials] = useState('ORG')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrganization = async () => {
      const orgId = sessionStorage.getItem('organizationId')
      if (!orgId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/organization/${orgId}`)
        const data = await response.json()

        if (data.success && data.organization) {
          const name = data.organization.name
          setOrgName(name)
          
          // Generate initials from organization name
          const initials = name
            .split(' ')
            .map((word: string) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
          setOrgInitials(initials)
        }
      } catch (error) {
        console.error('Failed to load organization:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()
  }, [])

  return (
    <aside className="w-64 border-r border-vault-slate/20 bg-vault-bg flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-vault-slate/20 flex items-center gap-3">
         <div className="text-vault-green p-1 border border-vault-green/20 rounded-md bg-vault-green/5">
            <Shield size={20} />
         </div>
         <span className="font-bold tracking-tight text-white">TrustNet <span className="font-thin text-vault-slate">ENT</span></span>
      </div>

      <div className="p-4 flex-1 space-y-1 overflow-y-auto">
        <div className="mb-6 px-2">
            <p className="text-[10px] text-vault-slate uppercase tracking-wider font-mono mb-2">Organization</p>
            <div className="flex items-center gap-2 p-2 rounded-md bg-vault-slate/5 border border-vault-slate/10">
                <div className="w-8 h-8 rounded bg-vault-blue flex items-center justify-center text-xs font-bold">
                  {loading ? '...' : orgInitials}
                </div>
                <div className="overflow-hidden">
                    <div className="text-sm font-bold truncate" title={orgName}>
                      {loading ? 'Loading...' : orgName}
                    </div>
                    <div className="text-[10px] text-vault-green flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-vault-green animate-pulse" /> Verified
                    </div>
                </div>
            </div>
        </div>

        <p className="text-[10px] text-vault-slate uppercase tracking-wider font-mono px-2 mb-2">Platform</p>
        
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
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-vault-slate font-mono uppercase">Privacy Score</span>
                <span className="text-xs text-vault-green font-bold">98/100</span>
            </div>
            <div className="h-1 bg-vault-slate/20 rounded-full overflow-hidden">
                <div className="h-full bg-vault-green w-[98%]" />
            </div>
         </div>
         <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-vault-slate hover:text-red-400 hover:bg-red-900/10">
                <LogOut size={16} className="mr-2" /> Disconnect
            </Button>
         </Link>
      </div>
    </aside>
  )
}
