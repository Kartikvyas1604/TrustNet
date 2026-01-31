'use client'

import React from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { WalletConnect } from '@/components/wallet/WalletConnect'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-vault-slate/20 bg-vault-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
            <div className="text-vault-green p-1 border border-vault-green/20 rounded-md bg-vault-green/5">
                <Shield size={24} />
            </div>
            <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight leading-none text-white">TrustNet</span>
                <span className="text-[10px] text-vault-slate font-mono uppercase tracking-wider">Enterprise Privacy</span>
            </div>
        </Link>
        
        <nav className="hidden md:flex gap-6 items-center">
            <Link href="/features" className="text-sm text-vault-slate hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-vault-slate hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-sm text-vault-slate hover:text-white transition-colors">Documentation</Link>
        </nav>

        <div className="flex items-center gap-4">
            <Link href="/auth">
                <Button variant="ghost" className="text-xs font-mono hidden md:inline-flex">SIGN IN</Button>
            </Link>
            <Link href="/auth">
                <Button variant="default" className="text-xs font-mono">GET STARTED</Button>
            </Link>
        </div>
      </div>
    </header>
  )
}
