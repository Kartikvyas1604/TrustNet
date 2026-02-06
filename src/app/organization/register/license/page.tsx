'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, Check } from 'lucide-react'

export default function LicenseSelectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employeeCount, setEmployeeCount] = useState(50)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY')
  const [pricing, setPricing] = useState({
    pricePerEmployee: 2,
    monthlyPrice: '100',
    annualPrice: '1020',
    subscriptionTier: 'STARTER',
  })

  useEffect(() => {
    calculatePricing(employeeCount)
  }, [employeeCount])

  const calculatePricing = (count: number) => {
    let pricePerEmployee = 2
    let tier = 'STARTER'

    if (count > 200) {
      pricePerEmployee = 1
      tier = 'ENTERPRISE'
    } else if (count > 50) {
      pricePerEmployee = 1.5
      tier = 'BUSINESS'
    }

    const monthly = (count * pricePerEmployee).toString()
    const annual = (count * pricePerEmployee * 12 * 0.85).toString()

    setPricing({
      pricePerEmployee,
      monthlyPrice: monthly,
      annualPrice: annual,
      subscriptionTier: tier,
    })
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const organizationId = sessionStorage.getItem('organizationId')
      if (!organizationId) {
        alert('Organization ID not found. Please start over.')
        router.push('/organization/register')
        return
      }

      const response = await fetch('/api/organization/register/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          employeeCount,
          billingCycle,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/organization/register/payment')
      } else {
        alert(data.error || 'License selection failed')
      }
    } catch (error) {
      console.error('License selection error:', error)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const totalCost = billingCycle === 'ANNUAL' ? pricing.annualPrice : pricing.monthlyPrice
  const savings = billingCycle === 'ANNUAL' 
    ? (parseFloat(pricing.monthlyPrice) * 12 - parseFloat(pricing.annualPrice)).toFixed(2)
    : '0'

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-4xl font-bold mb-4">Employee Licenses</h1>
          <p className="text-vault-slate text-lg">
            Select how many employees need access to TrustNet
          </p>
        </motion.div>

        <Card className="p-8 border-vault-slate/20 bg-vault-slate/5 mb-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-bold">Number of Employees</label>
              <span className="text-3xl font-bold text-vault-green">{employeeCount}</span>
            </div>
            <Slider
              value={[employeeCount]}
              onValueChange={(value: number[]) => setEmployeeCount(value[0])}
              min={1}
              max={1000}
              step={1}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-vault-slate">
              <span>1 employee</span>
              <span>1000+ employees</span>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="mb-8">
            <label className="text-lg font-bold mb-4 block">Billing Cycle</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  billingCycle === 'MONTHLY'
                    ? 'border-vault-green bg-vault-green/10'
                    : 'border-vault-slate/20 hover:border-vault-slate/40'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Monthly</span>
                  {billingCycle === 'MONTHLY' && (
                    <Check className="text-vault-green" size={20} />
                  )}
                </div>
                <div className="text-2xl font-bold">${pricing.monthlyPrice}</div>
                <div className="text-sm text-vault-slate">per month</div>
              </button>

              <button
                onClick={() => setBillingCycle('ANNUAL')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  billingCycle === 'ANNUAL'
                    ? 'border-vault-green bg-vault-green/10'
                    : 'border-vault-slate/20 hover:border-vault-slate/40'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Annual</span>
                  {billingCycle === 'ANNUAL' && (
                    <Check className="text-vault-green" size={20} />
                  )}
                </div>
                <div className="text-2xl font-bold">${pricing.annualPrice}</div>
                <div className="text-sm text-vault-slate">
                  per year <span className="text-vault-green">(Save ${savings})</span>
                </div>
              </button>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border-t border-vault-slate/20 pt-6">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-vault-slate">
                <span>Subscription Tier</span>
                <span className="font-bold text-white">{pricing.subscriptionTier}</span>
              </div>
              <div className="flex justify-between text-vault-slate">
                <span>Price per Employee</span>
                <span className="font-bold text-white">${pricing.pricePerEmployee}/{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
              </div>
              <div className="flex justify-between text-vault-slate">
                <span>Number of Employees</span>
                <span className="font-bold text-white">{employeeCount}</span>
              </div>
              {billingCycle === 'ANNUAL' && (
                <div className="flex justify-between text-vault-green">
                  <span>Annual Discount (15%)</span>
                  <span className="font-bold">-${savings}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-vault-slate/20">
              <span className="text-xl font-bold">Total</span>
              <span className="text-3xl font-bold text-vault-green">
                ${totalCost}
                <span className="text-lg text-vault-slate">/{billingCycle === 'MONTHLY' ? 'month' : 'year'}</span>
              </span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            variant="cyber"
            disabled={loading}
            className="px-8"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
      </div>
    </div>
  )
}
