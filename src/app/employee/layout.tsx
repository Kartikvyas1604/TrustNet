'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { EmployeeSidebar } from '@/components/layout/EmployeeSidebar'

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Public paths that don't require authentication
    const publicPaths = ['/employee/login', '/employee/onboard/wallet', '/employee/onboard/processing']
    
    // If on a public path, allow access immediately
    if (publicPaths.includes(pathname)) {
      setIsAuthorized(true)
      setIsChecking(false)
      return
    }

    // For protected routes, check authentication
    const employeeId = sessionStorage.getItem('employeeId')
    const tempToken = sessionStorage.getItem('tempToken')

    console.log('Auth check:', { pathname, employeeId, tempToken })

    // If not authenticated, redirect to login
    if (!employeeId && !tempToken) {
      console.log('Not authenticated, redirecting to login')
      setIsAuthorized(false)
      setIsChecking(false)
      router.replace('/employee/login')
      return
    }

    // Authenticated
    console.log('Authenticated, allowing access')
    setIsAuthorized(true)
    setIsChecking(false)
  }, [pathname, router])

  // Public paths can render immediately without sidebar
  const publicPaths = ['/employee/login', '/employee/onboard/wallet', '/employee/onboard/processing']
  if (publicPaths.includes(pathname)) {
    return <>{children}</>
  }

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-vault-green mb-4 mx-auto" />
          <p className="text-vault-slate">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Render with sidebar for authenticated routes
  return (
    <div className="min-h-screen bg-vault-bg text-vault-text">
      <EmployeeSidebar />
      <div className="pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
