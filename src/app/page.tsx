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
              ENTERPRISE-GRADE PRIVACY PAYROLL
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 font-sans">
              Private, Instant Payroll <br />
              <span className="text-vault-green">For Modern Companies</span>
            </h1>
            <p className="text-xl text-vault-slate max-w-2xl mx-auto mb-10 leading-relaxed">
              Zero-knowledge payroll distribution with free internal transactions. 
              Parent-child wallet architecture for compliance and privacy.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/organization/register">
                <Button size="lg" variant="cyber" className="text-lg h-14 px-8">
                  Sign Up as Organization <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/employee/login">
                <Button size="lg" variant="outline" className="text-lg h-14 px-8 border-vault-slate/30 hover:bg-vault-slate/10">
                  I&apos;m an Employee
                </Button>
              </Link>
            </div>
            
            <div className="mt-6 text-sm text-vault-slate">
              Already have an account? <Link href="/auth" className="text-vault-green hover:underline">Login here</Link>
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
              <h2 className="text-3xl font-bold mb-4">Trusted by Privacy-First Organizations</h2>
              <div className="flex gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Mock logos */}
                  <div className="h-8 w-32 bg-vault-slate/20 rounded-md" />
                  <div className="h-8 w-32 bg-vault-slate/20 rounded-md" />
                  <div className="h-8 w-32 bg-vault-slate/20 rounded-md" />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-8 text-right">
              <div>
                 <div className="text-4xl font-bold font-mono text-vault-green">2.4M+</div>
                 <div className="text-sm text-vault-slate uppercase tracking-wider">Private TXs</div>
              </div>
              <div>
                 <div className="text-4xl font-bold font-mono text-vault-green">100%</div>
                 <div className="text-sm text-vault-slate uppercase tracking-wider">Uptime</div>
              </div>
           </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 border-t border-vault-slate/10 bg-vault-darker/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
            <p className="text-vault-slate text-lg mb-12">Only pay for what you use. No hidden fees.</p>
            
            <Card className="p-12 bg-gradient-to-br from-vault-green/10 to-vault-green/5 border-vault-green/20">
              <div className="text-6xl font-bold text-vault-green mb-4">0.005 ETH</div>
              <div className="text-2xl text-vault-slate mb-8">per 10 employees</div>
              <ul className="space-y-4 text-left max-w-md mx-auto mb-8">
                {[
                  'Free internal transactions',
                  'Zero-knowledge privacy',
                  'Compliance-ready KYC',
                  'On-chain audit trails',
                  '24/7 support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-vault-slate">
                    <CheckCircle2 className="text-vault-green flex-shrink-0" size={20} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/organization/register">
                <Button size="lg" variant="cyber" className="text-lg">
                  Get Started Now <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-vault-slate/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vault-green/10 border border-vault-green/20 text-vault-green mb-6">
              <Shield size={16} />
              <span className="text-sm font-medium">Enterprise-Grade Security</span>
            </div>
            <h2 className="text-5xl font-bold mb-6">Ready to Transform Your Payroll?</h2>
            <p className="text-xl text-vault-slate mb-10 max-w-2xl mx-auto">
              Join leading organizations using privacy-preserving payroll infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/organization/register">
                <Button size="lg" variant="cyber" className="text-lg h-14 px-10">
                  Start Free Trial <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="text-lg h-14 px-10 border-vault-slate/30">
                  View Documentation
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      <footer className="py-16 border-t border-vault-slate/20 bg-vault-darker/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-vault-green mb-4">TrustNet</h3>
              <p className="text-vault-slate mb-6 max-w-md">
                Enterprise-grade privacy payroll infrastructure built on zero-knowledge proofs and decentralized networks.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'GitHub', 'Discord'].map((platform) => (
                  <div key={platform} className="w-10 h-10 rounded-lg border border-vault-slate/20 flex items-center justify-center hover:border-vault-green/30 hover:bg-vault-green/5 transition-colors cursor-pointer">
                    <span className="text-xs text-vault-slate">{platform[0]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-3 text-vault-slate">
                <li><Link href="/features" className="hover:text-vault-green transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-vault-green transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-vault-green transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-vault-green transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-3 text-vault-slate">
                <li><Link href="/about" className="hover:text-vault-green transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-vault-green transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-vault-green transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-vault-green transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-vault-slate/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-vault-slate text-sm">© 2026 TrustNet Enterprise Platform. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-vault-slate">
              <Link href="/privacy" className="hover:text-vault-green transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-vault-green transition-colors">Terms of Service</Link>
              <Link href="/security" className="hover:text-vault-green transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
