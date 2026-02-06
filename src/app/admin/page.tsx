'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Shield, Users, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Shield className="w-16 h-16 text-vault-green mx-auto mb-4" />
            <h1 className="text-5xl font-bold text-white mb-4">Admin Dashboard</h1>
            <p className="text-vault-slate text-lg">
              Manage organizations, approvals, and platform operations
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Organization Approvals */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card 
              className="bg-vault-darker border-vault-slate/20 hover:border-vault-green/50 transition-all cursor-pointer h-full"
              onClick={() => router.push('/admin/organizations')}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="w-8 h-8 text-vault-green" />
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <CardTitle className="text-white text-2xl">Organization Approvals</CardTitle>
                <CardDescription className="text-base">
                  Review and approve pending organization registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-vault-slate mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-vault-green" />
                    View organization details and documents
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-vault-green" />
                    Approve or reject registration requests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-vault-green" />
                    Track KYC verification status
                  </li>
                </ul>
                <Button className="w-full bg-vault-green hover:bg-vault-green/90">
                  Manage Organizations
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Transaction Approvals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card 
              className="bg-vault-darker border-vault-slate/20 hover:border-vault-green/50 transition-all cursor-pointer h-full"
              onClick={() => router.push('/admin/approvals')}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-vault-green" />
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <CardTitle className="text-white text-2xl">Transaction Approvals</CardTitle>
                <CardDescription className="text-base">
                  Review and approve pending external transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-vault-slate mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-vault-green" />
                    View external transfer requests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-vault-green" />
                    Review employee transaction history
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-vault-green" />
                    Approve or reject with reasons
                  </li>
                </ul>
                <Button className="w-full bg-vault-green hover:bg-vault-green/90">
                  Manage Transactions
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Access</CardTitle>
              <CardDescription>Navigate to key admin functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="border-vault-slate/20 hover:border-vault-green"
                  onClick={() => router.push('/admin/organizations')}
                >
                  Organizations
                </Button>
                <Button
                  variant="outline"
                  className="border-vault-slate/20 hover:border-vault-green"
                  onClick={() => router.push('/admin/approvals')}
                >
                  Approvals
                </Button>
                <Button
                  variant="outline"
                  className="border-vault-slate/20 hover:border-vault-green"
                  onClick={() => router.push('/')}
                >
                  Back to Home
                </Button>
                <Button
                  variant="outline"
                  className="border-vault-slate/20 hover:border-vault-green"
                  disabled
                >
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
