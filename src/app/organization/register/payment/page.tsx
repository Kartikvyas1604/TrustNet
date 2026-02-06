'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CreditCard, Wallet, Building2, FileText, ArrowLeft, Loader2, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type PaymentMethod = 'card' | 'crypto' | 'bank' | 'invoice'

export default function OrganizationPaymentPage() {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card')
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')
  const [pricingData, setPricingData] = useState<any>(null)
  const [usdcAddress, setUsdcAddress] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    const pricing = sessionStorage.getItem('pricingData')
    
    if (!orgId || !pricing) {
      router.push('/organization/register')
      return
    }

    setOrganizationId(orgId)
    setPricingData(JSON.parse(pricing))
  }, [router])

  const paymentMethods = [
    {
      id: 'card' as const,
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay securely with Stripe',
      available: true,
    },
    {
      id: 'crypto' as const,
      name: 'Crypto (USDC)',
      icon: Wallet,
      description: 'Pay with USDC on Ethereum',
      available: true,
    },
    {
      id: 'bank' as const,
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Wire transfer (3-5 days)',
      available: true,
    },
    {
      id: 'invoice' as const,
      name: 'Invoice (Enterprise)',
      icon: FileText,
      description: 'Net 30 payment terms',
      available: pricingData?.tier === 'Enterprise',
    },
  ]

  const handleCardPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/organization/register/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          paymentMethod: 'card',
          billingCycle: pricingData.billingCycle,
          employeeCount: pricingData.employeeCount,
        }),
      })

      const data = await response.json()

      if (data.success && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl
      } else {
        alert('Payment setup failed: ' + (data.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (error: any) {
      alert('Payment error: ' + error.message)
      setLoading(false)
    }
  }

  const handleCryptoPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/organization/register/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          paymentMethod: 'crypto',
          billingCycle: pricingData.billingCycle,
          employeeCount: pricingData.employeeCount,
        }),
      })

      const data = await response.json()

      if (data.success && data.usdcAddress) {
        setUsdcAddress(data.usdcAddress)
      } else {
        alert('Failed to generate payment address')
      }
      setLoading(false)
    } catch (error: any) {
      alert('Error: ' + error.message)
      setLoading(false)
    }
  }

  const handleBankTransfer = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/organization/register/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          paymentMethod: 'bank',
          billingCycle: pricingData.billingCycle,
          employeeCount: pricingData.employeeCount,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Bank transfer instructions sent to your email')
        router.push('/organization/register/verification')
      } else {
        alert('Failed to setup bank transfer')
      }
      setLoading(false)
    } catch (error: any) {
      alert('Error: ' + error.message)
      setLoading(false)
    }
  }

  const handleInvoice = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/organization/register/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          paymentMethod: 'invoice',
          billingCycle: pricingData.billingCycle,
          employeeCount: pricingData.employeeCount,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Invoice will be sent within 24 hours. You can proceed with KYC.')
        router.push('/organization/register/verification')
      } else {
        alert('Failed to setup invoice payment')
      }
      setLoading(false)
    } catch (error: any) {
      alert('Error: ' + error.message)
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    switch (selectedMethod) {
      case 'card':
        await handleCardPayment()
        break
      case 'crypto':
        await handleCryptoPayment()
        break
      case 'bank':
        await handleBankTransfer()
        break
      case 'invoice':
        await handleInvoice()
        break
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(usdcAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!pricingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-vault-slate hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Payment</h1>
          <p className="text-vault-slate">Choose your preferred payment method</p>
        </div>

        {/* Pricing Summary */}
        <Card className="bg-vault-darker border-vault-slate/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-vault-slate">
                <span>Plan:</span>
                <span className="text-white font-medium">{pricingData.tier}</span>
              </div>
              <div className="flex justify-between text-vault-slate">
                <span>Employees:</span>
                <span className="text-white font-medium">{pricingData.employeeCount}</span>
              </div>
              <div className="flex justify-between text-vault-slate">
                <span>Price per employee:</span>
                <span className="text-white font-medium">${pricingData.pricePerEmployee}/mo</span>
              </div>
              <div className="flex justify-between text-vault-slate">
                <span>Billing cycle:</span>
                <span className="text-white font-medium">
                  {pricingData.billingCycle === 'annual' ? 'Annual (15% off)' : 'Monthly'}
                </span>
              </div>
              <div className="border-t border-vault-slate/20 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Total:</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-vault-green">
                      ${pricingData.totalCost}
                      <span className="text-sm text-vault-slate">
                        /{pricingData.billingCycle === 'annual' ? 'year' : 'month'}
                      </span>
                    </div>
                    {pricingData.billingCycle === 'annual' && (
                      <div className="text-sm text-vault-slate">
                        ${(pricingData.totalCost / 12).toFixed(2)}/month
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {paymentMethods.map((method) => (
            <motion.div
              key={method.id}
              whileHover={{ scale: method.available ? 1.02 : 1 }}
              whileTap={{ scale: method.available ? 0.98 : 1 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  method.available
                    ? selectedMethod === method.id
                      ? 'bg-vault-green/10 border-vault-green'
                      : 'bg-vault-darker border-vault-slate/20 hover:border-vault-green/50'
                    : 'bg-vault-darker/50 border-vault-slate/10 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => method.available && setSelectedMethod(method.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        selectedMethod === method.id && method.available
                          ? 'bg-vault-green text-white'
                          : 'bg-vault-slate/10 text-vault-slate'
                      }`}
                    >
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{method.name}</h3>
                        {!method.available && (
                          <Badge variant="secondary" className="text-xs">
                            Unavailable
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-vault-slate">{method.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Crypto Payment Details */}
        {selectedMethod === 'crypto' && usdcAddress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white">Send USDC Payment</CardTitle>
                <CardDescription>Send exactly ${pricingData.totalCost} USDC to this address</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-vault-dark rounded-lg text-vault-green text-sm break-all">
                      {usdcAddress}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyAddress}
                      className="border-vault-slate/20"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-vault-green" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="p-4 bg-vault-dark rounded-lg text-center">
                    <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
                      <p className="text-vault-dark text-sm">QR Code</p>
                    </div>
                  </div>
                  <div className="text-sm text-vault-slate space-y-1">
                    <p>• Network: Ethereum Mainnet</p>
                    <p>• Token: USDC</p>
                    <p>• Amount: ${pricingData.totalCost} USDC</p>
                    <p>• Payment will be verified within 5-10 minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Submit Button */}
        {!(selectedMethod === 'crypto' && usdcAddress) && (
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-vault-green hover:bg-vault-green/90 text-white h-12"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue to Payment
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
