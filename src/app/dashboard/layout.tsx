'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { WalletConnect } from '@/components/wallet/WalletConnect'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Check if user is authenticated (either organization or employee)
    const organizationId = sessionStorage.getItem('organizationId')
    const employeeId = sessionStorage.getItem('employeeId')

    console.log('Dashboard auth check:', { pathname, organizationId, employeeId })

    // If neither organization nor employee is logged in, redirect to home
    if (!organizationId && !employeeId) {
      console.log('Not authenticated, redirecting to home')
      setIsAuthorized(false)
      setIsChecking(false)
      router.replace('/')
      return
    }

    // Authenticated
    console.log('Authenticated, allowing access')
    setIsAuthorized(true)
    setIsChecking(false)
  }, [pathname, router])

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-vault-bg text-vault-text flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-vault-green mb-4 mx-auto" />
          <p className="text-vault-slate">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If not authorized, don't render children (redirect is happening)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-vault-bg text-vault-text flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-vault-green mb-4 mx-auto" />
          <p className="text-vault-slate">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text">
        <Sidebar />
        
        <div className="pl-64">
             {/* Top Bar */}
             <header className="h-16 border-b border-vault-slate/20 bg-vault-bg/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-vault-slate">
                    <span className="font-mono text-vault-green">●</span> System Operational
                </div>
                
                <div className="flex items-center gap-4">
                    <button className="relative p-2 text-vault-slate hover:text-white transition-colors">
                        <Bell size={18} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </button>
                    <div className="h-6 w-px bg-vault-slate/20" />
                    <WalletConnect />
                </div>
             </header>

             <main className="p-6">
                {children}
             </main>
        </div>
    </div>
  )
}
