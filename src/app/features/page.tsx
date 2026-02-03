'use client'

import React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Eye, FileText, Users, Network, Cpu, Zap, Globe, Layers, Key } from 'lucide-react'

export default function FeaturesPage() {
  const mainFeatures = [
    {
      title: 'Zero-Knowledge Payroll',
      description: 'Disburse salaries to thousands of employees in a single transaction. Employee identities and amounts are cryptographically hidden from the public ledger but verifiable by the organization.',
      icon: Users,
      badge: 'CORE MODULE'
    },
    {
      title: 'Audit-Ready Compliance',
      description: 'Generate selective disclosure proofs for auditors and regulators. Prove solvency and compliance without exposing your entire transaction history or trade secrets.',
      icon: FileText,
      badge: 'REGULATORY'
    },
    {
      title: 'Privacy Pools',
      description: 'Asset mixing pools that break the on-chain link between sender and receiver. Designed with anti-money laundering (AML) controls embedded at the protocol level.',
      icon: Layers,
      badge: 'INFRASTRUCTURE'
    },
    {
      title: 'Decentralized Identity',
      description: 'Self-sovereign identity verification for employees. Onboard staff without creating a central honeypot of personal identifiable information (PII).',
      icon: Key,
      badge: 'IDENTITY'
    }
  ]

  const technicalSpecs = [
    {
      icon: Shield,
      title: 'ZK-SNARKs',
      desc: 'Utilizes Groth16 proofs for constant-size verification efficiency.'
    },
    {
      icon: Cpu,
      title: 'Move Language',
      desc: 'Written in Move for superior asset safety and formal verification.'
    },
    {
      icon: Network,
      title: 'High Throughput',
      desc: 'Parallel execution engine capable of 10,000+ TPS.'
    },
    {
      icon: Lock,
      title: 'Post-Quantum',
      desc: 'Lattice-based cryptography options for long-term security.'
    }
  ]

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text">
      <Navbar />
      
      {/* Hero Header */}
      <section className="relative py-20 border-b border-vault-slate/10 overflow-hidden">
        <div className="absolute inset-0 bg-vault-green/5 pointer-events-none" />
        <div className="absolute right-0 top-0 w-1/3 h-full bg-grid-pattern opacity-[0.05] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-vault-green/30 text-vault-green bg-vault-green/5 text-xs">
              <span className="w-2 h-2 rounded-full bg-vault-green animate-pulse mr-2" />
              PLATFORM CAPABILITIES
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-sans mb-6 max-w-4xl">
            The Operating System for <br />
            <span className="text-vault-green">Confidential Finance</span>
          </h1>
          <p className="text-xl text-vault-slate max-w-2xl leading-relaxed">
            TrustNet combines the permissionless nature of public blockchains with the 
            privacy controls required by modern enterprises.
          </p>
        </div>
      </section>

      {/* Main Feature Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {mainFeatures.map((feature, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-vault-slate/5 border border-vault-slate/20 flex items-center justify-center text-vault-green group-hover:bg-vault-green group-hover:text-vault-bg transition-colors duration-300">
                    <feature.icon size={32} />
                  </div>
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-vault-slate border border-vault-slate/20 px-2 py-0.5 rounded-sm">{feature.badge}</span>
                   </div>
                   <p className="text-vault-slate leading-relaxed text-lg">
                     {feature.description}
                   </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Deep Dive */}
      <section className="py-24 bg-vault-slate/5 border-y border-vault-slate/10">
        <div className="max-w-7xl mx-auto px-6">
           <div className="mb-16 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-4">Technical Specifications</h2>
              <p className="text-vault-slate max-w-2xl">
                Built from the ground up for performance, security, and developer ergonomics.
              </p>
           </div>
           
           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {technicalSpecs.map((spec, i) => (
                <div key={i} className="p-6 rounded-lg bg-vault-bg border border-vault-slate/10 hover:border-vault-green/30 transition-colors">
                   <div className="w-10 h-10 rounded-full bg-vault-slate/5 flex items-center justify-center mb-4 text-vault-green">
                      <spec.icon size={20} />
                   </div>
                   <h4 className="font-bold text-lg mb-2">{spec.title}</h4>
                   <p className="text-sm text-vault-slate">{spec.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to secure your organization?</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth">
                    <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto">
                        Get Started Now
                    </Button>
                </Link>
                <Link href="/contact">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto border-vault-slate/20">
                        Contact Sales
                    </Button>
                </Link>
            </div>
         </div>
      </section>
    </div>
  )
}
