'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Building2, Users, TrendingUp, Globe } from 'lucide-react'

const organizationTypes = [
  {
    id: 'Startup',
    title: 'Startup',
    description: '1-50 employees',
    icon: TrendingUp,
    suggested: 50,
    color: 'blue',
  },
  {
    id: 'Small Business',
    title: 'Small Business',
    description: '51-200 employees',
    icon: Building2,
    suggested: 200,
    color: 'green',
  },
  {
    id: 'Mid-Market',
    title: 'Mid-Market',
    description: '201-1000 employees',
    icon: Users,
    suggested: 1000,
    color: 'purple',
  },
  {
    id: 'Enterprise',
    title: 'Enterprise',
    description: '1000+ employees',
    icon: Globe,
    suggested: 5000,
    color: 'amber',
  },
]

export default function OrganizationTypePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleContinue = () => {
    if (selected) {
      sessionStorage.setItem('orgType', selected)
      router.push('/organization/register/details')
    }
  }

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">What best describes your organization?</h1>
          <p className="text-vault-slate text-lg">
            This helps us tailor the experience and pricing for your needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {organizationTypes.map((type, index) => {
            const Icon = type.icon
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                    selected === type.id
                      ? 'border-vault-green bg-vault-green/10'
                      : 'border-vault-slate/20 hover:border-vault-slate/40'
                  }`}
                  onClick={() => setSelected(type.id)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selected === type.id
                          ? 'bg-vault-green text-black'
                          : 'bg-vault-slate/10 text-vault-green'
                      }`}
                    >
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{type.title}</h3>
                      <p className="text-vault-slate">{type.description}</p>
                    </div>
                    {selected === type.id && (
                      <div className="w-6 h-6 rounded-full bg-vault-green flex items-center justify-center">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.3334 4L6.00002 11.3333L2.66669 8"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="border-vault-slate/30"
          >
            Back to Home
          </Button>
          <Button
            variant="cyber"
            onClick={handleContinue}
            disabled={!selected}
            className="px-8"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
