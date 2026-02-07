'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function OrganizationLayout({
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
    const publicPaths = [
      '/organization/register',
      '/organization/register/details',
      '/organization/register/license',
      '/organization/register/payment',
      '/organization/register/pending',
      '/organization/register/verification',
      '/organization/pending',
      '/organization/complete'
    ]
    
    // If on a public path, allow access immediately
    if (publicPaths.includes(pathname)) {
      setIsAuthorized(true)
      setIsChecking(false)
      return
    }

    // For protected routes, check authentication
    const organizationId = sessionStorage.getItem('organizationId')

    console.log('Organization auth check:', { pathname, organizationId })

    // If not authenticated, redirect to home
    if (!organizationId) {
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

  // Public paths can render immediately
  const publicPaths = [
    '/organization/register',
    '/organization/register/details',
    '/organization/register/license',
    '/organization/register/payment',
    '/organization/register/pending',
    '/organization/register/verification',
    '/organization/pending',
    '/organization/complete'
  ]
  
  if (publicPaths.includes(pathname)) {
    return <>{children}</>
  }

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
          <p className="text-vault-slate">Redirecting to home...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
