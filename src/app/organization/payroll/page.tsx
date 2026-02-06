'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  DollarSign, 
  ArrowLeft, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  PlayCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Employee {
  id: string
  nickname: string
  email: string
  walletAddress: string
  jobTitle: string
  amount: number
}

export default function OrganizationPayrollPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [selectedToken, setSelectedToken] = useState('USDC')

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register')
      return
    }
    setOrganizationId(orgId)
    loadData(orgId)
  }, [router])

  const loadData = async (orgId: string) => {
    try {
      // Load employees
      const empResponse = await fetch(`/api/organization/${orgId}/employees`)
      const empData = await empResponse.json()

      if (empData.success) {
        setEmployees(
          empData.employees.map((emp: any) => ({
            ...emp,
            amount: 0,
          }))
        )
      }

      // Load treasury balance
      const treasuryResponse = await fetch(`/api/treasury/${orgId}`)
      const treasuryData = await treasuryResponse.json()

      if (treasuryData.success) {
        // Sum up USDC balance across all chains
        const usdcBalance = treasuryData.balances.reduce(
          (sum: number, b: any) => (b.token === 'USDC' ? sum + b.amount : sum),
          0
        )
        setTreasuryBalance(usdcBalance)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAmount = (index: number, amount: number) => {
    const newEmployees = [...employees]
    newEmployees[index].amount = Math.max(0, amount)
    setEmployees(newEmployees)
  }

  const setAllToSame = () => {
    const amount = prompt('Enter amount for all employees:')
    if (amount && !isNaN(parseFloat(amount))) {
      const newEmployees = employees.map((emp) => ({
        ...emp,
        amount: parseFloat(amount),
      }))
      setEmployees(newEmployees)
    }
  }

  const clearAll = () => {
    const newEmployees = employees.map((emp) => ({
      ...emp,
      amount: 0,
    }))
    setEmployees(newEmployees)
  }

  const totalAmount = employees.reduce((sum, emp) => sum + emp.amount, 0)
  const employeesWithPayment = employees.filter((emp) => emp.amount > 0).length
  const canExecute = totalAmount > 0 && totalAmount <= treasuryBalance

  const executePayroll = async () => {
    if (!canExecute) return

    if (
      !confirm(
        `Execute payroll for ${employeesWithPayment} employees (Total: $${totalAmount.toFixed(2)})?`
      )
    ) {
      return
    }

    setExecuting(true)
    try {
      const payments = employees
        .filter((emp) => emp.amount > 0)
        .map((emp) => ({
          employeeId: emp.id,
          amount: emp.amount,
          token: selectedToken,
        }))

      const response = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          payments,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(
          `Payroll executed successfully! ${data.transactionsCreated} payments sent via Sui PTB.`
        )
        router.push('/dashboard/overview')
      } else {
        alert('Payroll execution failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setExecuting(false)
    }
  }

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

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Run Payroll</h1>
            <p className="text-vault-slate">Distribute payments to your team</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-vault-slate mb-1">Treasury Balance</p>
            <p className="text-3xl font-bold text-vault-green">
              ${treasuryBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-vault-darker border-vault-slate/20 mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-vault-slate mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-white">{employees.length}</p>
              </div>
              <div>
                <p className="text-sm text-vault-slate mb-1">Receiving Payment</p>
                <p className="text-2xl font-bold text-vault-green">{employeesWithPayment}</p>
              </div>
              <div>
                <p className="text-sm text-vault-slate mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-white">${totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-vault-slate mb-1">Remaining Balance</p>
                <p
                  className={`text-2xl font-bold ${
                    treasuryBalance - totalAmount >= 0 ? 'text-vault-green' : 'text-red-500'
                  }`}
                >
                  ${(treasuryBalance - totalAmount).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={setAllToSame}
            variant="outline"
            className="border-vault-slate/20"
            size="sm"
          >
            Set All to Same Amount
          </Button>
          <Button onClick={clearAll} variant="outline" className="border-vault-slate/20" size="sm">
            Clear All
          </Button>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-vault-slate/20 bg-vault-dark text-white text-sm focus:outline-none focus:ring-2 focus:ring-vault-green"
          >
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value="SUI">SUI</option>
          </select>
        </div>

        {/* Employee List */}
        <div className="space-y-3 mb-8">
          {employees.map((employee, index) => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-vault-darker border-vault-slate/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Employee Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-full bg-vault-green/20 flex items-center justify-center">
                          <span className="text-vault-green font-semibold">
                            {employee.nickname[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{employee.nickname}</p>
                          <p className="text-sm text-vault-slate">{employee.jobTitle}</p>
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-vault-slate/20 h-8 w-8"
                        onClick={() => updateAmount(index, employee.amount - 100)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>

                      <div className="w-32">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-slate">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={employee.amount || ''}
                            onChange={(e) =>
                              updateAmount(index, parseFloat(e.target.value) || 0)
                            }
                            className="bg-vault-dark border-vault-slate/20 text-white text-center pl-6 h-8"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="outline"
                        className="border-vault-slate/20 h-8 w-8"
                        onClick={() => updateAmount(index, employee.amount + 100)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Warning/Info */}
        {totalAmount > treasuryBalance && (
          <Card className="bg-red-500/10 border-red-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-200">
                  <p className="font-semibold mb-1">Insufficient Treasury Balance</p>
                  <p>
                    You need ${(totalAmount - treasuryBalance).toFixed(2)} more to execute this
                    payroll. Please deposit funds first.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {totalAmount > 0 && totalAmount <= treasuryBalance && (
          <Card className="bg-vault-green/10 border-vault-green mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-vault-green flex-shrink-0 mt-0.5" />
                <div className="text-sm text-vault-green">
                  <p className="font-semibold mb-1">Ready to Execute</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Payments will be sent via Sui Programmable Transaction Block</li>
                    <li>All {employeesWithPayment} transactions will execute atomically</li>
                    <li>Employees will receive instant notifications</li>
                    <li>Estimated gas cost: ~$0.02</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Execute Button */}
        <Button
          onClick={executePayroll}
          disabled={!canExecute || executing}
          className="w-full bg-vault-green hover:bg-vault-green/90 text-white h-14 text-lg"
        >
          {executing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Executing Payroll on Sui...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-6 w-6" />
              Execute Payroll - ${totalAmount.toFixed(2)} {selectedToken}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
