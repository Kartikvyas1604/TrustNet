'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, MoreHorizontal, UserPlus, Shield, Wifi, WifiOff, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient, type EmployeeResponse, type OnboardEmployeeRequest } from '@/lib/api'

const employees: any[] = []

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingData, setOnboardingData] = useState({
    authKey: '',
    walletAddress: '',
    chain: 'ethereum',
    nickname: '',
    email: '',
  })
  const [onboardingError, setOnboardingError] = useState('')
  const [isOnboarding, setIsOnboarding] = useState(false)

  // Demo organization ID - would come from auth context in production
  const organizationId = 'ORG-TECHCORP-001'

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getOrganizationEmployees(organizationId)
      if (response.success && response.data) {
        setEmployees(response.data)
      }
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOnboard = async () => {
    if (!onboardingData.authKey || !onboardingData.walletAddress) {
      setOnboardingError('Please provide auth key and wallet address')
      return
    }

    setOnboardingError('')
    setIsOnboarding(true)

    try {
      const request: OnboardEmployeeRequest = {
        authKey: onboardingData.authKey,
        walletAddress: onboardingData.walletAddress,
        signature: '0xmocksignature', // Would come from wallet signing
        chain: onboardingData.chain,
        profileData: {
          nickname: onboardingData.nickname,
          email: onboardingData.email,
        },
      }

      const response = await apiClient.onboardEmployee(request)

      if (response.success) {
        setShowOnboarding(false)
        setOnboardingData({ authKey: '', walletAddress: '', chain: 'ethereum', nickname: '', email: '' })
        await loadEmployees()
      } else {
        setOnboardingError(response.error || 'Onboarding failed')
      }
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : 'Onboarding failed')
    } finally {
      setIsOnboarding(false)
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.profileData as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.profileData as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-vault-slate/20 pb-4">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">EMPLOYEE NODE GRID</h1>
                <p className="text-vault-slate text-sm font-mono mt-1">Manage network access and identity verification</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                    <Filter size={14} /> Filter
                </Button>
                <Button 
                  className="gap-2 bg-vault-green text-black hover:bg-vault-green/90"
                  onClick={() => setShowOnboarding(!showOnboarding)}
                >
                    <UserPlus size={16} /> {showOnboarding ? 'Cancel' : 'Onboard Employee'}
                </Button>
            </div>
        </div>

        {/* Onboarding Form */}
        {showOnboarding && (
          <Card className="border-vault-green/30 bg-vault-bg">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Onboard New Employee</h3>
              {onboardingError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-red-500 text-sm flex items-center gap-2">
                  <XCircle size={16} />
                  {onboardingError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-vault-slate">Auth Key</label>
                  <input
                    className="w-full bg-vault-slate/5 border border-vault-slate/20 rounded p-2 text-sm text-white"
                    placeholder="DEMO-KEY-001"
                    value={onboardingData.authKey}
                    onChange={(e) => setOnboardingData({...onboardingData, authKey: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-vault-slate">Wallet Address</label>
                  <input
                    className="w-full bg-vault-slate/5 border border-vault-slate/20 rounded p-2 text-sm text-white font-mono"
                    placeholder="0x..."
                    value={onboardingData.walletAddress}
                    onChange={(e) => setOnboardingData({...onboardingData, walletAddress: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-vault-slate">Nickname</label>
                  <input
                    className="w-full bg-vault-slate/5 border border-vault-slate/20 rounded p-2 text-sm text-white"
                    placeholder="alice"
                    value={onboardingData.nickname}
                    onChange={(e) => setOnboardingData({...onboardingData, nickname: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-vault-slate">Email</label>
                  <input
                    type="email"
                    className="w-full bg-vault-slate/5 border border-vault-slate/20 rounded p-2 text-sm text-white"
                    placeholder="alice@company.com"
                    value={onboardingData.email}
                    onChange={(e) => setOnboardingData({...onboardingData, email: e.target.value})}
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-vault-green text-black hover:bg-vault-green/90"
                onClick={handleOnboard}
                disabled={isOnboarding}
              >
                {isOnboarding ? 'Onboarding...' : 'Complete Onboarding'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <div className="relative">
            <Search className="absolute left-3 top-3 text-vault-slate w-5 h-5" />
            <input 
                className="w-full bg-vault-slate/5 border border-vault-slate/10 rounded-md p-3 pl-10 font-mono text-sm text-white focus:border-vault-slate/30 outline-none transition-colors"
                placeholder="Search by ID, Name, or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
                <div className="col-span-full py-16 text-center">
                    <p className="text-vault-slate font-mono text-sm">Loading employees...</p>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                    <p className="text-vault-slate/50 font-mono text-sm">
                      {searchTerm ? 'No employees match your search.' : 'No employees yet. Onboard your first employee to get started.'}
                    </p>
                </div>
            ) : filteredEmployees.map((emp) => (
                <motion.div key={emp.id} variants={itemVariants}>
                    <Card className="hover:border-vault-green/30 transition-colors group cursor-pointer border-vault-slate/10 bg-vault-bg">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold ${
                                        emp.status === 'ACTIVE' ? 'bg-vault-green/10 text-vault-green border border-vault-green/20' : 'bg-vault-slate/10 text-vault-slate border border-vault-slate/20'
                                    }`}>
                                        {emp.employeeId.slice(-3)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">
                                          {(emp.profileData as any)?.name || emp.employeeId}
                                        </div>
                                        <div className="text-[10px] text-vault-slate uppercase font-mono">
                                          {(emp.profileData as any)?.position || 'Employee'}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-1 hover:bg-vault-slate/10 rounded">
                                    <MoreHorizontal size={14} className="text-vault-slate" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-b border-vault-slate/10 py-3 my-2">
                                <div className="text-vault-slate">WALLET</div>
                                <div className="text-right text-vault-blue font-mono">
                                  {Object.values(emp.walletAddresses)[0]?.slice(0, 6)}...{Object.values(emp.walletAddresses)[0]?.slice(-4)}
                                </div>
                                <div className="text-vault-slate">STATUS</div>
                                <div className="text-right text-white">{emp.status}</div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    {emp.status === 'ACTIVE' ? (
                                        <Wifi size={14} className="text-vault-green" />
                                    ) : (
                                        <WifiOff size={14} className="text-vault-red" />
                                    )}
                                    <span className={`text-xs font-bold ${
                                        emp.status === 'ACTIVE' ? 'text-vault-green' : 'text-vault-red'
                                    }`}>
                                        {emp.status}
                                    </span>
                                </div>
                                {emp.status === 'ACTIVE' && (
                                    <Shield size={14} className="text-vault-blue" />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    </motion.div>
  )
}
