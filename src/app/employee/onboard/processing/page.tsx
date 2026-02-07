'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'

interface Step {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed'
}

export default function EmployeeProcessingPage() {
  const router = useRouter()
  const [steps, setSteps] = useState<Step[]>([
    { id: '1', title: 'Creating your ENS subdomain', status: 'pending' },
    { id: '2', title: 'Deploying your wallet on Sui', status: 'pending' },
    { id: '3', title: 'Opening payment channel', status: 'pending' },
    { id: '4', title: 'Adding you to organization', status: 'pending' },
  ])
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    processSteps()
  }, [])

  const processSteps = async () => {
    for (let i = 0; i < steps.length; i++) {
      // Update to processing
      setCurrentStep(i)
      setSteps(prev => prev.map((step, idx) => 
        idx === i ? { ...step, status: 'processing' } : step
      ))

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update to completed
      setSteps(prev => prev.map((step, idx) => 
        idx === i ? { ...step, status: 'completed' } : step
      ))
    }

    // Wait a moment then redirect
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push('/employee/dashboard')
  }

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-vault-green/10 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-vault-green animate-spin" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Setting Up Your Account</h1>
          <p className="text-vault-slate text-lg">
            Please wait while we complete your onboarding...
          </p>
        </motion.div>

        <Card className="p-8 border-vault-slate/20 bg-vault-slate/5">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-vault-slate/5 border border-vault-slate/10"
              >
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <div className="w-8 h-8 rounded-full bg-vault-green flex items-center justify-center">
                      <Check className="w-5 h-5 text-black" />
                    </div>
                  ) : step.status === 'processing' ? (
                    <div className="w-8 h-8 rounded-full border-2 border-vault-green border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-vault-slate/30" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    step.status === 'completed' ? 'text-vault-green' :
                    step.status === 'processing' ? 'text-white' :
                    'text-vault-slate'
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-vault-green/10 border border-vault-green/30">
            <p className="text-sm text-vault-green">
              🔐 All operations are secure and encrypted
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center text-sm text-vault-slate">
          This usually takes 5-10 seconds
        </div>
      </div>
    </div>
  )
}
