'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Loader2, 
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Filter,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Transaction {
  id: string
  type: 'sent' | 'received'
  status: 'confirmed' | 'pending' | 'rejected'
  amount: number
  token: string
  from: string
  to: string
  memo?: string
  timestamp: string
  txHash?: string
  isInternal: boolean
}

export default function EmployeeTransactionsPage() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all')

  useEffect(() => {
    const empId = sessionStorage.getItem('employeeId')
    if (!empId) {
      router.push('/employee/login')
      return
    }
    setEmployeeId(empId)
    loadTransactions(empId)
  }, [router])

  const loadTransactions = async (empId: string) => {
    try {
      const response = await fetch(`/api/transactions/history/${empId}`)
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true
    return tx.type === filter
  })

  const totalSent = transactions
    .filter((tx) => tx.type === 'sent' && tx.status === 'confirmed')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalReceived = transactions
    .filter((tx) => tx.type === 'received' && tx.status === 'confirmed')
    .reduce((sum, tx) => sum + tx.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-5xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-vault-slate hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Transaction History</h1>
          <p className="text-vault-slate">View all your payment activity</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">${totalSent.toFixed(2)}</p>
                  <p className="text-sm text-vault-slate">Total Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-vault-green/20 flex items-center justify-center">
                  <ArrowDownLeft className="w-6 h-6 text-vault-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">${totalReceived.toFixed(2)}</p>
                  <p className="text-sm text-vault-slate">Total Received</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{transactions.length}</p>
                  <p className="text-sm text-vault-slate">Total Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="bg-vault-darker border-vault-slate/20 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-vault-slate" />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className={
                    filter === 'all'
                      ? 'bg-vault-green hover:bg-vault-green/90'
                      : 'border-vault-slate/20'
                  }
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'sent' ? 'default' : 'outline'}
                  onClick={() => setFilter('sent')}
                  className={
                    filter === 'sent'
                      ? 'bg-vault-green hover:bg-vault-green/90'
                      : 'border-vault-slate/20'
                  }
                >
                  Sent
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'received' ? 'default' : 'outline'}
                  onClick={() => setFilter('received')}
                  className={
                    filter === 'received'
                      ? 'bg-vault-green hover:bg-vault-green/90'
                      : 'border-vault-slate/20'
                  }
                >
                  Received
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-vault-slate mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Transactions Yet</h3>
              <p className="text-vault-slate mb-4">
                Your transaction history will appear here
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => router.push('/employee/send')}
                  className="bg-vault-green hover:bg-vault-green/90"
                >
                  Send Payment
                </Button>
                <Button
                  onClick={() => router.push('/employee/receive')}
                  variant="outline"
                  className="border-vault-slate/20"
                >
                  Receive Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-vault-darker border-vault-slate/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          transaction.type === 'sent'
                            ? 'bg-red-500/20'
                            : 'bg-vault-green/20'
                        }`}
                      >
                        {transaction.type === 'sent' ? (
                          <ArrowUpRight className="w-6 h-6 text-red-400" />
                        ) : (
                          <ArrowDownLeft className="w-6 h-6 text-vault-green" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-white font-semibold capitalize">
                            {transaction.type}
                          </h3>
                          <Badge
                            className={
                              transaction.status === 'confirmed'
                                ? 'bg-vault-green/20 text-vault-green'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-red-500/20 text-red-400'
                            }
                          >
                            {transaction.status === 'confirmed' && (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {transaction.status === 'pending' && (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {transaction.status === 'rejected' && (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {transaction.status}
                          </Badge>
                          {transaction.isInternal && (
                            <Badge className="bg-blue-500/20 text-blue-400">Internal</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-vault-slate">
                          <span>
                            {transaction.type === 'sent' ? 'To:' : 'From:'}{' '}
                            <code className="text-vault-green">
                              {transaction.type === 'sent'
                                ? transaction.to.slice(0, 8) + '...' + transaction.to.slice(-6)
                                : transaction.from.slice(0, 8) + '...' + transaction.from.slice(-6)}
                            </code>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(transaction.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {transaction.memo && (
                          <p className="text-sm text-vault-slate mt-1 italic">
                            "{transaction.memo}"
                          </p>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            transaction.type === 'sent' ? 'text-red-400' : 'text-vault-green'
                          }`}
                        >
                          {transaction.type === 'sent' ? '-' : '+'}${transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-vault-slate">{transaction.token}</p>
                      </div>

                      {/* View TX */}
                      {transaction.txHash && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="border-vault-slate/20"
                          onClick={() =>
                            window.open(`https://suiscan.xyz/mainnet/tx/${transaction.txHash}`)
                          }
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
