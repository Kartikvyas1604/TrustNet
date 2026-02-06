'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Send, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Zap,
  Clock,
  DollarSign,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export default function EmployeeSendPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employeeId, setEmployeeId] = useState<string>('')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('USDC')
  const [memo, setMemo] = useState('')
  const [isInternal, setIsInternal] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [balance, setBalance] = useState({ onChain: 0, offChain: 0 })

  useEffect(() => {
    const empId = sessionStorage.getItem('employeeId')
    if (!empId) {
      router.push('/employee/login')
      return
    }
    setEmployeeId(empId)
    loadBalance(empId)
  }, [router])

  const loadBalance = async (empId: string) => {
    try {
      const response = await fetch(`/api/employee/balance/${empId}`)
      const data = await response.json()
      if (data.success) {
        setBalance(data.balance)
      }
    } catch (error) {
      console.error('Failed to load balance:', error)
    }
  }

  const checkRecipient = async () => {
    if (!recipient || recipient.length < 10) {
      setIsInternal(null)
      return
    }

    setChecking(true)
    try {
      const response = await fetch('/api/employee/check-recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, employeeId }),
      })

      const data = await response.json()

      if (data.success) {
        setIsInternal(data.isInternal)
      }
    } catch (error) {
      console.error('Recipient check failed:', error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recipient) {
        checkRecipient()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [recipient])

  const handleSend = async () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      alert('Please fill in all fields with valid values')
      return
    }

    const amountNum = parseFloat(amount)
    const totalBalance = balance.onChain + balance.offChain

    if (amountNum > totalBalance) {
      alert('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmployeeId: employeeId,
          toAddress: recipient,
          amount: amountNum,
          token,
          memo,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.internal) {
          alert('Payment sent instantly! ⚡')
          router.push('/dashboard/overview')
        } else {
          alert('Payment request submitted. Awaiting organization approval.')
          router.push('/dashboard/overview')
        }
      } else {
        alert('Transaction failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-4xl font-bold text-white mb-2">Send Payment</h1>
          <p className="text-vault-slate">Send funds to employees or external addresses</p>
        </div>

        {/* Balance Card */}
        <Card className="bg-vault-darker border-vault-slate/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-vault-slate mb-1">On-chain (Sui)</p>
                <p className="text-2xl font-bold text-vault-green">
                  ${balance.onChain.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-vault-slate mb-1">Off-chain (Yellow)</p>
                <p className="text-2xl font-bold text-vault-green">
                  ${balance.offChain.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-vault-slate/20">
              <p className="text-sm text-vault-slate">Total Available</p>
              <p className="text-3xl font-bold text-white">
                ${(balance.onChain + balance.offChain).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Send Form */}
        <Card className="bg-vault-darker border-vault-slate/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Payment Details</CardTitle>
            <CardDescription>Enter recipient and amount information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <div className="relative">
                <Input
                  id="recipient"
                  placeholder="ENS name (alice.trustnet.eth) or wallet address (0x...)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-vault-dark border-vault-slate/20 text-white"
                />
                {checking && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-vault-slate" />
                  </div>
                )}
              </div>
              {isInternal !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  {isInternal ? (
                    <Badge className="bg-vault-green text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      Internal Transfer - Instant & Free
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      External Transfer - Requires Approval
                    </Badge>
                  )}
                </motion.div>
              )}
            </div>

            {/* Amount & Token */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-slate" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-vault-dark border-vault-slate/20 text-white pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <select
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full h-10 rounded-md border border-vault-slate/20 bg-vault-dark text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vault-green"
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                  <option value="SUI">SUI</option>
                </select>
              </div>
            </div>

            {/* Memo */}
            <div className="space-y-2">
              <Label htmlFor="memo">Memo (Optional)</Label>
              <Input
                id="memo"
                placeholder="Payment for Q1 2024 work"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="bg-vault-dark border-vault-slate/20 text-white"
              />
            </div>

            {/* Transaction Info */}
            {isInternal !== null && amount && parseFloat(amount) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`${
                  isInternal
                    ? 'bg-vault-green/10 border-vault-green'
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-vault-slate">Amount:</span>
                        <span className="text-white font-medium">
                          ${parseFloat(amount).toFixed(2)} {token}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vault-slate">Network Fee:</span>
                        <span className="text-white font-medium">
                          {isInternal ? '$0.00' : '~$0.50'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vault-slate">Processing Time:</span>
                        <span className="text-white font-medium">
                          {isInternal ? '<100ms' : '~5 mins (after approval)'}
                        </span>
                      </div>
                      <div className="border-t border-current/20 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-white font-semibold">Total:</span>
                          <span className="text-white font-semibold">
                            ${(parseFloat(amount) + (isInternal ? 0 : 0.5)).toFixed(2)} {token}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Info Alert */}
        {!isInternal && isInternal !== null && (
          <Card className="bg-yellow-500/10 border-yellow-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-100">
                  <p className="font-semibold mb-1">External Transfer Notice:</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-200/80">
                    <li>Your organization admin must approve this transaction</li>
                    <li>Funds will be locked until approved or rejected</li>
                    <li>You'll receive a notification once processed</li>
                    <li>Approval typically takes 1-24 hours</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={loading || !recipient || !amount || parseFloat(amount) <= 0}
          className="w-full bg-vault-green hover:bg-vault-green/90 text-white h-12"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              {isInternal ? 'Send Instantly' : 'Request Approval'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
