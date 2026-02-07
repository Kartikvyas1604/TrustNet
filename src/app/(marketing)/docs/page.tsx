'use client'

import React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/shared/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Book, Code, Terminal, FileText, ArrowRight, Server, Shield, Lock } from 'lucide-react'

export default function DocsPage() {
  const categories = [
    {
      icon: Book,
      title: 'Getting Started',
      description: 'Installation, quick start guides, and core concepts of TrustNet.',
      links: ['Introduction', 'Installation', 'Architecture Overview', 'First Transaction']
    },
    {
      icon: Code,
      title: 'Smart Contracts',
      description: 'Deep dive into our Move modules for privacy and asset management.',
      links: ['Move Language Basics', 'Privacy Pool Module', 'Payroll Distributor', 'Audit Logs']
    },
    {
      icon: Terminal,
      title: 'API Reference',
      description: 'Complete reference for the TrustNet REST API and SDKs.',
      links: ['Authentication', 'Transaction Endpoints', 'Wallet Management', 'Webhooks']
    },
    {
      icon: Server,
      title: 'Node Operators',
      description: 'Requirements and guides for running a TrustNet validator node.',
      links: ['Hardware Requirements', 'Node Setup', 'Staking', 'Troubleshooting']
    },
    {
      icon: Shield,
      title: 'Security & Compliance',
      description: 'Understanding ZK-proofs, auditability, and regulatory compliance.',
      links: ['Zero-Knowledge Proofs', 'Audit Trail Format', 'Regulatory Standards', 'Key Management']
    },
    {
      icon: Lock,
      title: 'Privacy Explained',
      description: 'How we keep employee and organization data completely private.',
      links: ['Data Encryption', 'Transaction Mixing', 'Anonymity Sets', 'Access Control']
    }
  ]

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text">
      <Navbar />
      
      {/* Docs Header */}
      <div className="border-b border-vault-slate/20 bg-vault-bg/50 backdrop-blur-sm relative">
         <div className="absolute inset-0 bg-vault-green/5 pointer-events-none" />
         <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
            <Badge variant="outline" className="mb-4 text-vault-green border-vault-green/20 bg-vault-green/5">
                DOCUMENTATION v1.0
            </Badge>
            <h1 className="text-4xl font-bold font-sans mb-6">
                Build on <span className="text-vault-green">TrustNet</span>
            </h1>
            <p className="text-xl text-vault-slate max-w-2xl mb-8">
                Explore our guides and examples to integrate enterprise-grade privacy into your financial applications.
            </p>
            
            <div className="max-w-xl relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-vault-slate">
                    <Search size={20} />
                </div>
                <input 
                    type="text" 
                    placeholder="Search documentation..." 
                    className="w-full h-12 rounded-sm bg-vault-bg border border-vault-slate/30 pl-12 pr-4 text-vault-text placeholder:text-vault-slate/50 focus:outline-none focus:border-vault-green/50 transition-colors"
                />
            </div>
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, i) => (
                <Card key={i} className="group border-vault-slate/20 hover:border-vault-green/30 transition-colors bg-vault-bg">
                    <CardHeader className="pb-4">
                        <div className="w-10 h-10 rounded-lg bg-vault-slate/5 flex items-center justify-center text-vault-green mb-4 border border-vault-slate/10 group-hover:border-vault-green/20 transition-colors">
                            <category.icon size={20} />
                        </div>
                        <CardTitle className="text-xl font-bold font-sans mb-2">{category.title}</CardTitle>
                         <p className="text-sm text-vault-slate leading-relaxed">
                            {category.description}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {category.links.map((link, j) => (
                                <li key={j}>
                                    <Link href="#" className="text-sm text-vault-slate/80 hover:text-vault-green flex items-center justify-between group/link transition-colors">
                                        <span>{link}</span>
                                        <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="mt-20 p-8 rounded-lg border border-vault-slate/20 bg-vault-slate/5 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
                 <h2 className="text-2xl font-bold mb-2">Need help?</h2>
                 <p className="text-vault-slate">Can't find what you're looking for? Join our developer community.</p>
             </div>
             <div className="flex gap-4">
                 <Button variant="outline" className="border-vault-slate/30">
                     Join Discord
                 </Button>
                 <Button variant="default">
                     Contact Support
                 </Button>
             </div>
        </div>
      </main>
    </div>
  )
}
