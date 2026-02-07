'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  ArrowLeft, 
  Loader2, 
  Copy,
  Check,
  QrCode,
  TrendingUp,
  Clock,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Balance {
  chain: string
  token: string
  amount: number
  usdValue: number
}

interface Deposit {
  id: string
  chain: string
  token: string
  amount: number
  txHash: string
  timestamp: string
  status: string
}

export default function OrganizationTreasuryPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<Balance[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [depositAddresses, setDepositAddresses] = useState<any>({})
  const [copiedAddress, setCopiedAddress] = useState('')

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register')
      return
    }
    setOrganizationId(orgId)
    checkStatusAndLoadData(orgId)
  }, [router])

  const checkStatusAndLoadData = async (orgId: string) => {
    try {
      // Check organization status first
      const statusResponse = await fetch(`/api/organization/status/${orgId}`)
      const statusData = await statusResponse.json()

      if (statusData.success && statusData.organization.kycStatus !== 'APPROVED') {
        router.push('/organization/pending')
        return
      }

      // Load treasury data
      await loadTreasuryData(orgId)
    } catch (error) {
      console.error('Failed to load treasury data:', error)
      setLoading(false)
    }
  }

  const loadTreasuryData = async (orgId: string) => {
    try {
      // Load balances
      const balanceResponse = await fetch(`/api/treasury/${orgId}`)
      
      if (!balanceResponse.ok) {
        console.error('Failed to fetch balances:', balanceResponse.status, balanceResponse.statusText)
        setBalances([])
      } else {
        const contentType = balanceResponse.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const balanceData = await balanceResponse.json()
          if (balanceData.success && balanceData.data?.balances) {
            // Transform balance object into array format
            const balanceObj = balanceData.data.balances
            const balanceArray: Balance[] = Object.keys(balanceObj)
              .filter(key => key !== 'total')
              .map(chain => ({
                chain,
                token: 'USDC',
                amount: parseFloat(balanceObj[chain] || '0'),
                usdValue: parseFloat(balanceObj[chain] || '0'),
              }))
            setBalances(balanceArray)
          } else {
            setBalances([])
          }
        } else {
          console.error('Received non-JSON response for balances')
          setBalances([])
        }
      }

      // Load deposit history
      const depositResponse = await fetch(`/api/treasury/${orgId}/deposits`)
      
      if (!depositResponse.ok) {
        console.error('Failed to fetch deposits:', depositResponse.status, depositResponse.statusText)
        setDeposits([])
      } else {
        const contentType = depositResponse.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const depositData = await depositResponse.json()
          if (depositData.success && depositData.deposits) {
            setDeposits(depositData.deposits)
          } else {
            setDeposits([])
          }
        } else {
          console.error('Received non-JSON response for deposits')
          setDeposits([])
        }
      }
    } catch (error) {
      console.error('Failed to load treasury data:', error)
      setBalances([])
      setDeposits([])
    } finally {
      setLoading(false)
    }
  }

  const generateDepositAddress = async (chain: string, token: string) => {
    try {
      // Convert chain name to lowercase to match backend format
      const chainLowerCase = chain.toLowerCase()
      
      const response = await fetch(`/api/treasury/${organizationId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain: chainLowerCase, token }),
      })

      if (!response.ok) {
        console.error('Failed to generate deposit address:', response.status)
        return
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response for deposit address')
        return
      }

      const data = await response.json()

      if (data.success && data.address) {
        setDepositAddresses({
          ...depositAddresses,
          [`${chain}-${token}`]: data.address,
        })
      } else {
        console.error('Failed to generate deposit address:', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Failed to generate deposit address:', error)
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(''), 2000)
  }

  const totalUsdValue = balances?.reduce((sum, b) => sum + b.usdValue, 0) || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-vault-slate hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Treasury</h1>
            <p className="text-vault-slate">Manage your organization's funds across chains</p>
          </div>
          <Button
            onClick={() => router.push('/organization/payroll')}
            className="bg-vault-green hover:bg-vault-green/90"
          >
            Run Payroll
          </Button>
        </div>

        {/* Total Balance */}
        <Card className="bg-gradient-to-br from-vault-green/20 to-vault-green/5 border-vault-green/30 mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-vault-slate mb-2 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Total Treasury Value
                </p>
                <p className="text-5xl font-bold text-white mb-4">
                  ${totalUsdValue.toFixed(2)}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-vault-green" />
                  <span className="text-vault-green">+12.5%</span>
                  <span className="text-vault-slate">vs last month</span>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-vault-green text-white mb-2">Multi-Chain</Badge>
                <p className="text-sm text-vault-slate">{balances.length} Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="balances" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
          </TabsList>

          {/* Balances Tab */}
          <TabsContent value="balances" className="space-y-4">
            {balances.length === 0 ? (
              <Card className="bg-vault-darker border-vault-slate/20">
                <CardContent className="p-12 text-center">
                  <Wallet className="w-16 h-16 text-vault-slate mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Assets Yet</h3>
                  <p className="text-vault-slate mb-4">
                    Deposit funds to your treasury to get started
                  </p>
                  <Button
                    onClick={() => {
                      const tabs = document.querySelector('[role="tablist"]')
                      const depositTab = tabs?.querySelector('[value="deposit"]') as HTMLElement
                      depositTab?.click()
                    }}
                    className="bg-vault-green hover:bg-vault-green/90"
                  >
                    Deposit Funds
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {balances.map((balance, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-vault-darker border-vault-slate/20">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-2xl font-bold text-white mb-1">
                              {balance.amount.toFixed(4)} {balance.token}
                            </p>
                            <p className="text-sm text-vault-slate">
                              ${balance.usdValue.toFixed(2)} USD
                            </p>
                          </div>
                          <Badge variant="outline" className="border-vault-slate/20">
                            {balance.chain}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-vault-slate/20"
                            onClick={() => {
                              const tabs = document.querySelector('[role="tablist"]')
                              const depositTab = tabs?.querySelector('[value="deposit"]') as HTMLElement
                              depositTab?.click()
                            }}
                          >
                            Deposit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-vault-slate/20"
                          >
                            Send
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Recent Deposits */}
            {deposits.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Deposits</h3>
                <div className="space-y-3">
                  {deposits.slice(0, 5).map((deposit) => (
                    <Card key={deposit.id} className="bg-vault-darker border-vault-slate/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-vault-green/20 flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-vault-green" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                +{deposit.amount} {deposit.token}
                              </p>
                              <p className="text-sm text-vault-slate">
                                {new Date(deposit.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={
                                deposit.status === 'confirmed'
                                  ? 'bg-vault-green text-white'
                                  : 'bg-yellow-500 text-white'
                              }
                            >
                              {deposit.status}
                            </Badge>
                            <a
                              href={`https://suiscan.xyz/mainnet/tx/${deposit.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-vault-green hover:underline flex items-center gap-1 mt-1"
                            >
                              View TX
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white">Deposit Funds</CardTitle>
                <CardDescription>
                  Generate deposit addresses for your organization treasury
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Sui USDC */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">USDC on Sui</h3>
                      <Badge className="bg-blue-500/20 text-blue-400">Recommended</Badge>
                    </div>

                    {!depositAddresses['Sui-USDC'] ? (
                      <Button
                        onClick={() => generateDepositAddress('Sui', 'USDC')}
                        variant="outline"
                        className="w-full border-vault-slate/20"
                      >
                        Generate Address
                      </Button>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 bg-vault-dark rounded-lg text-vault-green text-sm break-all">
                            {depositAddresses['Sui-USDC']}
                          </code>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyAddress(depositAddresses['Sui-USDC'])}
                            className="border-vault-slate/20"
                          >
                            {copiedAddress === depositAddresses['Sui-USDC'] ? (
                              <Check className="h-4 w-4 text-vault-green" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="p-4 bg-white rounded-lg">
                          <div className="w-full aspect-square flex items-center justify-center">
                            <QrCode className="w-24 h-24 text-vault-dark" />
                          </div>
                        </div>
                        <p className="text-sm text-vault-slate text-center">
                          Send USDC on Sui Network to this address
                        </p>
                      </>
                    )}
                  </div>

                  {/* Ethereum USDC */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">USDC on Ethereum</h3>
                    </div>

                    {!depositAddresses['Ethereum-USDC'] ? (
                      <Button
                        onClick={() => generateDepositAddress('Ethereum', 'USDC')}
                        variant="outline"
                        className="w-full border-vault-slate/20"
                      >
                        Generate Address
                      </Button>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 bg-vault-dark rounded-lg text-vault-green text-sm break-all">
                            {depositAddresses['Ethereum-USDC']}
                          </code>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyAddress(depositAddresses['Ethereum-USDC'])}
                            className="border-vault-slate/20"
                          >
                            {copiedAddress === depositAddresses['Ethereum-USDC'] ? (
                              <Check className="h-4 w-4 text-vault-green" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="p-4 bg-white rounded-lg">
                          <div className="w-full aspect-square flex items-center justify-center">
                            <QrCode className="w-24 h-24 text-vault-dark" />
                          </div>
                        </div>
                        <p className="text-sm text-vault-slate text-center">
                          Send USDC on Ethereum to this address
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deposit Instructions */}
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white">Deposit Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-vault-slate">
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-vault-green mt-0.5 flex-shrink-0" />
                    <span>
                      Deposits are typically confirmed within 2-5 seconds on Sui, 15-30 seconds on
                      Ethereum
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-vault-green mt-0.5 flex-shrink-0" />
                    <span>
                      Your balance will automatically update once the transaction is confirmed
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-vault-green mt-0.5 flex-shrink-0" />
                    <span>
                      All deposits are tracked and visible in your transaction history
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-vault-green mt-0.5 flex-shrink-0" />
                    <span>
                      You can use deposited funds immediately for payroll and transactions
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
