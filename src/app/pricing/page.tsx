'use client'

import React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Check, Shield, Zap, Building2 } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'Developer',
      price: '$0',
      description: 'For building and testing privacy-preserving dApps.',
      features: [
        'Testnet Access',
        'Up to 3 Organization Wallets',
        'Basic Transaction Logs',
        'Community Support',
        'ZKP Verification (Testnet)'
      ],
      cta: 'Start Building',
      variant: 'outline' as const
    },
    {
      name: 'Commercial',
      price: '$499',
      period: '/month',
      description: 'Production-grade privacy for growing businesses.',
      features: [
        'Mainnet Deployment',
        'Unlimited Employee Wallets',
        'Full Audit Trail Compliance',
        'Priority 24/7 Support',
        'Automated Payroll Dist',
        'Regulatory Reporting Tools'
      ],
      popular: true,
      cta: 'Get Started',
      variant: 'default' as const
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Tailored solutions for large-scale institutional needs.',
      features: [
        'Dedicated Private Shards',
        'Custom ZK Circuits',
        'On-Premise Deployment',
        'White-label Employee Portal',
        'SLA Guarantees',
        'Designated Success Manager'
      ],
      cta: 'Contact Sales',
      variant: 'outline' as const
    }
  ]

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 text-vault-green border-vault-green/20 bg-vault-green/5">
            TRANSPARENT PRICING
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-sans mb-6">
            Enterprise-Grade Privacy, <br />
            <span className="text-vault-green">Simple Pricing</span>
          </h1>
          <p className="text-xl text-vault-slate">
            Choose a plan that fits your organization's compliance and privacy requirements. 
            Scale seamlessly from pilot to production.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <Card key={i} className={`flex flex-col relative ${plan.popular ? 'border-vault-green/40 ring-1 ring-vault-green/20' : 'border-vault-slate/20'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-vault-green text-vault-bg text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="p-8 pb-4">
                <h3 className="text-lg font-mono font-bold text-vault-slate uppercase tracking-wider mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-vault-slate font-mono text-sm">{plan.period}</span>}
                </div>
                <p className="text-vault-slate/80 text-sm leading-relaxed mb-6 h-10">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="p-8 pt-0 flex-1 flex flex-col">
                <hr className="border-vault-slate/10 mb-6" />
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-vault-slate/90">
                      <Check className="w-5 h-5 text-vault-green shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.variant}
                  // Map button variants to match available variants or standard ones
                  // Assuming 'default', 'secondary', 'outline', 'cyber' are valid based on context
                  // Using inline style or simpler classes if 'cyber' isn't standard
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 pt-10 border-t border-vault-slate/10 grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-2">
            <h4 className="font-bold flex items-center justify-center md:justify-start gap-2">
              <Shield className="text-vault-green mb-1" size={20} />
              Audit Ready
            </h4>
            <p className="text-sm text-vault-slate">All basic and enterprise plans include automated audit log generation for compliance.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold flex items-center justify-center md:justify-start gap-2">
              <Zap className="text-vault-green mb-1" size={20} />
              Zero-Knowledge
            </h4>
            <p className="text-sm text-vault-slate">Transactions are verified without revealing sensitive payroll or vendor data.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold flex items-center justify-center md:justify-start gap-2">
              <Building2 className="text-vault-green mb-1" size={20} />
              Banking Integration
            </h4>
            <p className="text-sm text-vault-slate">Seamless on/off ramps for major fiat currencies in Commercial tier.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
