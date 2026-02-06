'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CreditCard, Wallet, Building2, FileText, ArrowLeft, Loader2, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type PaymentMethod = 'card' | 'crypto' | 'bank' | 'invoice'

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any
  }
}

export default function OrganizationPaymentPage() {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card')
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')
  const [pricingData, setPricingData] = useState<any>(null)
  const [paymentAddress, setPaymentAddress] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [paymentSent, setPaymentSent] = useState(false)

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
      name: 'Crypto (ETH)',
      icon: Wallet,
      description: 'Pay with Ethereum',
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
        }),
      })

      const result = await response.json()

      if (result.success && result.data?.paymentInfo) {
        const { paymentAddress, amount } = result.data.paymentInfo
        setPaymentAddress(paymentAddress)
        setPaymentAmount(amount)
      } else {
        alert('Failed to generate payment address: ' + (result.error || 'Unknown error'))
      }
      setLoading(false)
    } catch (error: any) {
      alert('Error: ' + error.message)
      setLoading(false)
    }
  }

  const sendEthPayment = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to pay with crypto')
      return
    }

    setLoading(true)
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const fromAddress = accounts[0]

      // Convert amount to wei (assuming amount is in ETH)
      const amountInWei = '0x' + Math.floor(paymentAmount * 1e18).toString(16)

      // Send transaction
      const transactionHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: fromAddress,
          to: paymentAddress,
          value: amountInWei,
        }],
      })

      setTxHash(transactionHash)
      setPaymentSent(true)

      // Verify payment on backend
      const verifyResponse = await fetch('/api/organization/register/payment/verify-crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          txHash: transactionHash,
        }),
      })

      const verifyResult = await verifyResponse.json()

      if (verifyResult.success) {
        alert('Payment verified! Proceeding to verification step.')
        router.push('/organization/register/verification')
      } else {
        alert('Payment sent but verification failed. Please contact support with TX: ' + transactionHash)
      }

      setLoading(false)
    } catch (error: any) {
      alert('Payment failed: ' + error.message)
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
    navigator.clipboard.writeText(paymentAddress)
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
        {selectedMethod === 'crypto' && paymentAddress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white">Send ETH Payment</CardTitle>
                <CardDescription>
                  Send {paymentAmount} ETH to complete your subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-vault-slate mb-2 block">Payment Address</label>
                    <div className="flex items-center gap-2 bg-vault-dark p-3 rounded-lg border border-vault-slate/20">
                      <code className="flex-1 text-white text-sm break-all">{paymentAddress}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyAddress}
                        className="text-vault-green hover:text-vault-green/80"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-vault-slate mb-2 block">Amount</label>
                    <div className="bg-vault-dark p-3 rounded-lg border border-vault-slate/20">
                      <p className="text-white font-mono text-lg">{paymentAmount} ETH</p>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <p className="text-amber-500 text-sm">
                      ⚠️ <strong>Important:</strong> Send exactly {paymentAmount} ETH to the address above using your MetaMask wallet. Click "Pay with MetaMask" button below for easy payment.
                    </p>
                  </div>

                  {paymentSent && txHash && (
                    <div className="bg-vault-green/10 border border-vault-green/20 rounded-lg p-4">
                      <p className="text-vault-green text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <strong>Payment sent!</strong>
                      </p>
                      <p className="text-vault-slate text-xs mt-1">
                        TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={sendEthPayment}
                    disabled={loading || paymentSent}
                    className="w-full bg-vault-green hover:bg-vault-green/90 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : paymentSent ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Payment Sent
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Pay with MetaMask
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Submit Button - Show for non-crypto or when crypto address not generated */}
        {!(selectedMethod === 'crypto' && paymentAddress) && (
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
            ) : selectedMethod === 'crypto' ? (
              <>
                Generate Payment Address
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
