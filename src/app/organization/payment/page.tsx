'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, Loader2, Copy, ExternalLink, AlertCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('orgId')

  const [paymentConfig, setPaymentConfig] = useState<any>(null)
  const [txHash, setTxHash] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchPaymentConfig()
  }, [])

  const fetchPaymentConfig = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/payment/config')
      const data = await response.json()
      if (data.success) {
        setPaymentConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching payment config:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVerifyPayment = async () => {
    if (!txHash) {
      setError('Please enter transaction hash')
      return
    }

    if (!organizationId) {
      setError('Organization ID not found')
      return
    }

    try {
      setVerifying(true)
      setError('')

      const response = await fetch('http://localhost:5001/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          txHash: txHash.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setVerified(true)
        setTimeout(() => {
          router.push(`/organization/complete?orgId=${organizationId}`)
        }, 2000)
      } else {
        setError(data.error || 'Payment verification failed')
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      setError('Failed to verify payment. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  if (!paymentConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Verified!</h2>
          <p className="text-gray-600 mb-4">
            Your subscription has been activated successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to setup...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
            <p className="text-gray-600">
              Send exactly {paymentConfig.requiredAmount} ETH to activate your subscription
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* QR Code Section */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                <QRCodeSVG
                  value={`ethereum:${paymentConfig.treasuryAddress}?value=${parseFloat(paymentConfig.requiredAmount) * 1e18}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Scan with your wallet app
              </p>
            </div>

            {/* Payment Details  */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Network</label>
                <div className="mt-1 p-3 bg-blue-50 rounded-lg font-mono text-sm">
                  {paymentConfig.network} (Chain ID: {paymentConfig.chainId})
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Treasury Address</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="font-mono text-sm truncate mr-2">
                    {paymentConfig.treasuryAddress}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(paymentConfig.treasuryAddress)}
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Amount</label>
                <div className="mt-1 p-3 bg-green-50 rounded-lg font-semibold text-lg">
                  {paymentConfig.requiredAmount} {paymentConfig.currency}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Send exactly {paymentConfig.requiredAmount} ETH</li>
                      <li>Use Base Sepolia network</li>
                      <li>Wait for transaction confirmation</li>
                      <li>Enter transaction hash below</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Hash Input */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold mb-4">Verify Your Payment</h3>
            <p className="text-sm text-gray-600 mb-4">
              After sending the payment, enter your transaction hash to verify and activate your subscription.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Transaction Hash</label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="mt-1"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleVerifyPayment}
                  disabled={verifying || !txHash}
                  className="flex-1"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Payment'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://sepolia.basescan.org/address/${paymentConfig.treasuryAddress}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-semibold mb-2">Need help?</p>
            <p>If you encounter any issues with the payment, please contact our support team.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
