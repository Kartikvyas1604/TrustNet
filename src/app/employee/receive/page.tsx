'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Check, QrCode, Wallet, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function EmployeeReceivePage() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState<string>('')
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [copiedENS, setCopiedENS] = useState(false)
  const [copiedWallet, setCopiedWallet] = useState(false)

  useEffect(() => {
    const empId = sessionStorage.getItem('employeeId')
    if (!empId) {
      router.push('/employee/login')
      return
    }
    setEmployeeId(empId)
    loadEmployeeData(empId)
  }, [router])

  const loadEmployeeData = async (empId: string) => {
    try {
      const response = await fetch(`/api/employee/profile/${empId}`)
      
      if (!response.ok) {
        console.error('Failed to fetch profile:', response.status)
        return
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response for profile')
        return
      }
      
      const data = await response.json()
      if (data.success) {
        setEmployeeData(data.employee)
      }
    } catch (error) {
      console.error('Failed to load employee data:', error)
    }
  }

  const copyToClipboard = (text: string, type: 'ens' | 'wallet') => {
    navigator.clipboard.writeText(text)
    if (type === 'ens') {
      setCopiedENS(true)
      setTimeout(() => setCopiedENS(false), 2000)
    } else {
      setCopiedWallet(true)
      setTimeout(() => setCopiedWallet(false), 2000)
    }
  }

  if (!employeeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <div className="text-vault-slate">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-3xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-vault-slate hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Receive Payment</h1>
          <p className="text-vault-slate">Share your payment address or ENS name</p>
        </div>

        {/* Info Alert */}
        <Card className="bg-blue-500/10 border-blue-500/20 mb-8">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-100">
                <p className="font-semibold mb-1">Multiple Ways to Receive:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-200/80">
                  <li>Share your ENS subdomain for easy internal transfers</li>
                  <li>Use your Sui wallet address for on-chain deposits</li>
                  <li>Accept funds from any employee in your organization instantly</li>
                  <li>External deposits will appear after blockchain confirmation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="ens" className="mb-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="ens">ENS Subdomain</TabsTrigger>
            <TabsTrigger value="wallet">Wallet Address</TabsTrigger>
          </TabsList>

          {/* ENS Subdomain Tab */}
          <TabsContent value="ens" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-vault-green" />
                  Your ENS Subdomain
                </CardTitle>
                <CardDescription>
                  Easy-to-remember name for receiving payments within your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ENS Display */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-vault-slate">ENS Name:</span>
                    <Badge className="bg-vault-green/20 text-vault-green">
                      Internal Transfers Only
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-4 bg-vault-dark rounded-lg text-vault-green text-lg font-medium break-all text-center">
                      {employeeData.ensSubdomain || `${employeeData.nickname}.${employeeData.organizationName}.eth`}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(employeeData.ensSubdomain || `${employeeData.nickname}.${employeeData.organizationName}.eth`, 'ens')}
                      className="border-vault-slate/20 h-14 w-14"
                    >
                      {copiedENS ? (
                        <Check className="h-5 w-5 text-vault-green" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="p-6 bg-vault-dark rounded-lg">
                  <div className="w-64 h-64 mx-auto bg-white rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-vault-dark mx-auto mb-2" />
                      <p className="text-vault-dark text-sm">ENS QR Code</p>
                    </div>
                  </div>
                  <p className="text-center text-vault-slate text-sm mt-4">
                    Scan to send payment to {employeeData.nickname}
                  </p>
                </div>

                {/* How it Works */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold">How it Works:</h3>
                  <ul className="space-y-2 text-sm text-vault-slate">
                    <li className="flex items-start gap-2">
                      <span className="text-vault-green">•</span>
                      <span>
                        Any employee in <strong className="text-white">{employeeData.organizationName}</strong> can
                        send you payments using just your nickname
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-vault-green">•</span>
                      <span>
                        Transfers are <strong className="text-white">instant</strong> and <strong className="text-white">free</strong> via
                        Yellow Network off-chain state channels
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-vault-green">•</span>
                      <span>
                        No gas fees, no waiting for blockchain confirmations
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Address Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-vault-green" />
                  Your Sui Wallet Address
                </CardTitle>
                <CardDescription>
                  On-chain address for receiving external deposits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Wallet Display */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-vault-slate">Wallet Address:</span>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      Sui Network
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-4 bg-vault-dark rounded-lg text-vault-green text-sm break-all">
                      {employeeData.walletAddress || '0x1234...5678'}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(employeeData.walletAddress || '0x1234...5678', 'wallet')}
                      className="border-vault-slate/20 h-14 w-14"
                    >
                      {copiedWallet ? (
                        <Check className="h-5 w-5 text-vault-green" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="p-6 bg-vault-dark rounded-lg">
                  <div className="w-64 h-64 mx-auto bg-white rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-vault-dark mx-auto mb-2" />
                      <p className="text-vault-dark text-sm">Wallet QR Code</p>
                    </div>
                  </div>
                  <p className="text-center text-vault-slate text-sm mt-4">
                    Scan to send on-chain payment
                  </p>
                </div>

                {/* Supported Tokens */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Supported Tokens:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['USDC', 'USDT', 'SUI', 'ETH'].map((token) => (
                      <div
                        key={token}
                        className="p-3 bg-vault-dark rounded-lg text-center"
                      >
                        <p className="text-white font-medium">{token}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Notes */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold">Important Notes:</h3>
                  <ul className="space-y-2 text-sm text-vault-slate">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">⚠️</span>
                      <span>
                        Only send tokens on the <strong className="text-white">Sui Network</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">⚠️</span>
                      <span>
                        Deposits typically confirm within <strong className="text-white">2-5 seconds</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">⚠️</span>
                      <span>
                        Small network fees apply for on-chain deposits (~$0.01)
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Share Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="border-vault-slate/20"
            onClick={() => {
              const text = `Send me payment at ${employeeData.ensSubdomain || employeeData.nickname}`
              if (navigator.share) {
                navigator.share({ text })
              } else {
                copyToClipboard(text, 'ens')
              }
            }}
          >
            Share ENS Name
          </Button>
          <Button
            variant="outline"
            className="border-vault-slate/20"
            onClick={() => {
              const text = `My Sui wallet: ${employeeData.walletAddress}`
              if (navigator.share) {
                navigator.share({ text })
              } else {
                copyToClipboard(text, 'wallet')
              }
            }}
          >
            Share Wallet Address
          </Button>
        </div>
      </div>
    </div>
  )
}
