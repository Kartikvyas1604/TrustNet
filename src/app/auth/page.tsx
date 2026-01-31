'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowRight, Check, Key, Wallet, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { AuthKeyInput } from '@/components/dashboard/AuthKeyInput'

export default function AuthPage() {
  const [step, setStep] = useState(1)
  const [orgType, setOrgType] = useState<'enterprise' | 'employee' | null>(null)

  const steps = [
    { id: 1, title: 'Role Selection', icon: User },
    { id: 2, title: 'Verification', icon: Key },
    { id: 3, title: 'Wallet', icon: Wallet },
    { id: 4, title: 'Complete', icon: Check }
  ]

  const handleRoleSelect = (type: 'enterprise' | 'employee') => {
      setOrgType(type)
      setStep(2)
  }

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex flex-col relative overflow-hidden">
         {/* Background */}
         <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] animate-drift pointer-events-none" />
         <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-vault-green/5 to-transparent pointer-events-none" />

         {/* Header */}
         <header className="p-6 relative z-10">
             <Link href="/" className="flex items-center gap-2">
                <div className="text-vault-green p-1 border border-vault-green/20 rounded-md bg-vault-green/5">
                    <Shield size={20} />
                </div>
                <span className="font-bold tracking-tight text-white">DVPN <span className="text-vault-slate font-thin">AUTH</span></span>
             </Link>
         </header>

         {/* Main Content */}
         <main className="flex-1 flex items-center justify-center p-6 relative z-10">
             <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
                 
                 {/* Left Side: Progress & Info */}
                 <div className="space-y-8 hidden md:block">
                     <div>
                         <h1 className="text-4xl font-bold mb-2">Secure Access Gateway</h1>
                         <p className="text-vault-slate">Authenticate to access the DVPN Enterprise Network.</p>
                     </div>

                     <div className="space-y-6 relative">
                         <div className="absolute top-0 left-4 h-full w-px bg-vault-slate/20 -z-10" />
                         {steps.map((s) => (
                             <div key={s.id} className="flex items-center gap-4">
                                 <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${step >= s.id ? 'bg-vault-green text-vault-bg border-vault-green' : 'bg-vault-bg border-vault-slate/30 text-vault-slate'}`}>
                                     <s.icon size={14} />
                                 </div>
                                 <div className={`${step === s.id ? 'text-white font-bold' : step > s.id ? 'text-vault-green' : 'text-vault-slate/50'}`}>
                                     {s.title}
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Right Side: Interactive Form */}
                 <div className="relative">
                     <AnimatePresence mode="wait">
                         {step === 1 && (
                             <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                             >
                                 <Card>
                                     <CardHeader>
                                         <CardTitle>Select Account Type</CardTitle>
                                         <CardDescription>Choose how you want to access the network</CardDescription>
                                     </CardHeader>
                                     <CardContent className="space-y-4">
                                         <button 
                                            onClick={() => handleRoleSelect('enterprise')}
                                            className="w-full text-left p-4 rounded-md border border-vault-slate/20 hover:border-vault-green/50 bg-vault-slate/5 hover:bg-vault-slate/10 transition-all group"
                                         >
                                             <div className="flex items-center justify-between mb-2">
                                                 <span className="font-bold font-sans text-white group-hover:text-vault-green">Organization Admin</span>
                                                 <Building2 size={18} className="text-vault-slate group-hover:text-vault-green" />
                                             </div>
                                             <p className="text-xs text-vault-slate">Register a company, manage employees, and audit logs.</p>
                                         </button>
                                         
                                         <button 
                                            onClick={() => handleRoleSelect('employee')}
                                            className="w-full text-left p-4 rounded-md border border-vault-slate/20 hover:border-vault-blue/50 bg-vault-slate/5 hover:bg-vault-slate/10 transition-all group"
                                         >
                                             <div className="flex items-center justify-between mb-2">
                                                 <span className="font-bold font-sans text-white group-hover:text-vault-blue">Employee</span>
                                                 <User size={18} className="text-vault-slate group-hover:text-vault-blue" />
                                             </div>
                                             <p className="text-xs text-vault-slate">Connect with an Auth Key provided by your organization.</p>
                                         </button>
                                     </CardContent>
                                 </Card>
                             </motion.div>
                         )}

                         {step === 2 && (
                             <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                             >
                                 <Card>
                                     <CardHeader>
                                         <CardTitle>{orgType === 'enterprise' ? 'Verify Credentials' : 'Enter Auth Key'}</CardTitle>
                                         <CardDescription>
                                            {orgType === 'enterprise' 
                                                ? 'Upload your KYC documents to continue.' 
                                                : 'Enter the XXXX-XXXX formatted key.'}
                                        </CardDescription>
                                     </CardHeader>
                                     <CardContent className="space-y-4">
                                         {orgType === 'employee' ? (
                                             <AuthKeyInput />
                                         ) : (
                                             <div className="h-32 border-2 border-dashed border-vault-slate/30 rounded-md flex flex-col items-center justify-center text-vault-slate text-sm">
                                                 <span>Drag & Drop Business License</span>
                                                 <span className="text-[10px] opacity-50">PDF, JPG (Max 5MB)</span>
                                             </div>
                                         )}
                                         <div className="flex justify-between pt-4">
                                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                            <Button onClick={() => setStep(3)}>Continue <ArrowRight size={14} className="ml-2" /></Button>
                                         </div>
                                     </CardContent>
                                 </Card>
                             </motion.div>
                         )}

                         {step === 3 && (
                             <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                             >
                                 <Card>
                                     <CardHeader>
                                         <CardTitle>Connect Wallet</CardTitle>
                                         <CardDescription>Link your Web3 identity</CardDescription>
                                     </CardHeader>
                                     <CardContent className="space-y-4">
                                         <div className="p-4 bg-vault-slate/5 rounded border border-vault-slate/20 text-center">
                                             <Wallet className="mx-auto mb-2 text-vault-slate" size={32} />
                                             <p className="text-sm font-mono text-vault-slate">No wallet detected</p>
                                         </div>
                                         <Button variant="default" className="w-full h-12" onClick={() => setStep(4)}>
                                             Launch Wallet Simulator
                                         </Button>
                                         <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                                     </CardContent>
                                 </Card>
                             </motion.div>
                         )}

                         {step === 4 && (
                             <motion.div 
                                key="step4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                             >
                                 <div className="w-20 h-20 bg-vault-green/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-vault-green">
                                     <Check size={40} className="text-vault-green" />
                                 </div>
                                 <h2 className="text-3xl font-bold mb-2">Access Granted</h2>
                                 <p className="text-vault-slate mb-8">Secure tunnel established. You are now connected.</p>
                                 
                                 <Link href="/dashboard">
                                     <Button size="lg" variant="cyber" className="w-full">
                                         Enter Dashboard
                                     </Button>
                                 </Link>
                             </motion.div>
                         )}
                     </AnimatePresence>
                 </div>
             </div>
         </main>
    </div>
  )
}
