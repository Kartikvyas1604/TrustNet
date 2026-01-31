'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Globe, Server, CheckCircle2, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-vault-bg text-vault-text selection:bg-vault-green/30">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none animate-drift" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-vault-green/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-1.5 border-vault-green/30 text-vault-green bg-vault-green/5 text-xs">
              <span className="w-2 h-2 rounded-full bg-vault-green animate-pulse mr-2" />
              ENTERPRISE-GRADE ZK-PRIVACY
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 font-sans">
              Protect Corporate Assets <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vault-green to-vault-blue">On The Public Chain</span>
            </h1>
            <p className="text-xl text-vault-slate max-w-2xl mx-auto mb-10 leading-relaxed">
              The first decentralized VPN network designed for institutional compliance. 
              Zero-knowledge interactions, audit-ready logs, and complete employee anonymity.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth">
                <Button size="lg" variant="cyber" className="text-lg h-14 px-8">
                  Start Verification <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8 border-vault-slate/30 hover:bg-vault-slate/10">
                View Documentation
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-vault-slate/10 bg-vault-bg/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Zero-Knowledge Architecture",
                desc: "Cryptography that proves transaction validity without revealing sender, receiver, or amount."
              },
              {
                icon: Server,
                title: "Compliance-First Core",
                desc: "Built-in KYC verification and selective disclosure keys for regulatory audits."
              },
              {
                icon: Globe,
                title: "Global Mesh Network",
                desc: "Decentralized node infrastructure ensuring 100% uptime and censorship resistance."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-lg border border-vault-slate/10 bg-vault-slate/5 hover:border-vault-green/30 hover:bg-vault-slate/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-vault-bg border border-vault-slate/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="text-vault-green" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-vault-slate leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By / Stats */}
      <section className="py-20 border-t border-vault-slate/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
           <div className="text-left">
              <h2 className="text-3xl font-bold mb-4">Trusted by Privacy-First Organsations</h2>
              <div className="flex gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Mock logos */}
                  <div className="h-8 w-32 bg-vault-slate/20 rounded-md" />
                  <div className="h-8 w-32 bg-vault-slate/20 rounded-md" />
                  <div className="h-8 w-32 bg-vault-slate/20 rounded-md" />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-8 text-right">
              <div>
                 <div className="text-4xl font-bold font-mono text-vault-blue">2.4M+</div>
                 <div className="text-sm text-vault-slate uppercase tracking-wider">Private TXs</div>
              </div>
              <div>
                 <div className="text-4xl font-bold font-mono text-vault-green">100%</div>
                 <div className="text-sm text-vault-slate uppercase tracking-wider">Uptime</div>
              </div>
           </div>
        </div>
      </section>
      
      <footer className="py-12 border-t border-vault-slate/20 bg-vault-bg">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-vault-slate text-sm">© 2026 TrustNet Enterprise Platform. All rights reserved.</p>
          </div>
      </footer>
    </div>
  )
}
