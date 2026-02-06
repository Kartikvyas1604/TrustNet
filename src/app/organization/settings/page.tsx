'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Loader2, 
  Building2,
  Mail,
  Phone,
  Key,
  CreditCard,
  Users,
  Globe,
  Shield,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orgData, setOrgData] = useState<any>(null)

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register')
      return
    }
    setOrganizationId(orgId)
    loadOrganizationData(orgId)
  }, [router])

  const loadOrganizationData = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organization/status/${orgId}`)
      const data = await response.json()

      if (data.success) {
        setOrgData(data.organization)
      }
    } catch (error) {
      console.error('Failed to load organization data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/organization/${organizationId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData),
      })

      const data = await response.json()

      if (data.success) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vault-green" />
      </div>
    )
  }

  if (!orgData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 flex items-center justify-center">
        <p className="text-vault-slate">Organization not found</p>
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
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-vault-slate">Manage your organization configuration</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-vault-green hover:bg-vault-green/90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-vault-green" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Organization Name</Label>
                    <Input
                      value={orgData.organizationName || ''}
                      onChange={(e) =>
                        setOrgData({ ...orgData, organizationName: e.target.value })
                      }
                      className="bg-vault-dark border-vault-slate/20 text-white"
                    />
                  </div>
                  <div>
                    <Label>Legal Name</Label>
                    <Input
                      value={orgData.legalName || ''}
                      onChange={(e) => setOrgData({ ...orgData, legalName: e.target.value })}
                      className="bg-vault-dark border-vault-slate/20 text-white"
                    />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Input
                      value={orgData.industry || ''}
                      onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                      className="bg-vault-dark border-vault-slate/20 text-white"
                    />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      value={orgData.website || ''}
                      onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                      className="bg-vault-dark border-vault-slate/20 text-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-vault-green" />
                  Admin Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={orgData.adminName || ''}
                      onChange={(e) => setOrgData({ ...orgData, adminName: e.target.value })}
                      className="bg-vault-dark border-vault-slate/20 text-white"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={orgData.adminEmail || ''}
                      onChange={(e) => setOrgData({ ...orgData, adminEmail: e.target.value })}
                      className="bg-vault-dark border-vault-slate/20 text-white"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={orgData.adminPhone || ''}
                      onChange={(e) => setOrgData({ ...orgData, adminPhone: e.target.value })}
                      className="bg-vault-dark border-vault-slate/20 text-white"
                    />
                  </div>
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      value={orgData.adminJobTitle || ''}
                      onChange={(e) => setOrgData({ ...orgData, adminJobTitle: e.target.value })}
                      className="bg-vault-dark border-vault-slate/20 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Settings */}
          <TabsContent value="subscription" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-vault-green" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-vault-slate">Plan Tier</Label>
                    <p className="text-2xl font-bold text-white mt-1">{orgData.tier}</p>
                  </div>
                  <div>
                    <Label className="text-vault-slate">Employee Licenses</Label>
                    <p className="text-2xl font-bold text-white mt-1">{orgData.employeeCount}</p>
                  </div>
                  <div>
                    <Label className="text-vault-slate">Billing Cycle</Label>
                    <p className="text-2xl font-bold text-white mt-1 capitalize">
                      {orgData.billingCycle}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-vault-dark rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-vault-slate">Monthly Cost</span>
                    <span className="text-xl font-bold text-vault-green">
                      ${orgData.totalCost}/
                      {orgData.billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-vault-slate">Next Billing Date</span>
                    <span className="text-white">
                      {new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push('/organization/register/license')}
                    className="bg-vault-green hover:bg-vault-green/90"
                  >
                    Upgrade Plan
                  </Button>
                  <Button variant="outline" className="border-vault-slate/20">
                    Manage Billing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-vault-green" />
                  Wallet & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-vault-slate">Admin Wallet Address</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 p-3 bg-vault-dark rounded-lg text-vault-green">
                      {orgData.walletAddress || '0x...'}
                    </code>
                    <Badge className="bg-vault-green/20 text-vault-green">Verified</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-vault-slate">Auth Keys Generated</Label>
                  <p className="text-2xl font-bold text-white mt-1">
                    {orgData.authKeys?.length || 0} keys
                  </p>
                </div>

                <Button
                  onClick={() => router.push('/organization/auth-keys')}
                  variant="outline"
                  className="border-vault-slate/20"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Manage Auth Keys
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-vault-darker border-vault-slate/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-vault-green" />
                  Blockchain Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-vault-dark rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 font-semibold">SUI</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Sui Blockchain</p>
                      <p className="text-sm text-vault-slate">Child wallets & payroll</p>
                    </div>
                  </div>
                  <Badge className="bg-vault-green text-white">Connected</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-vault-dark rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 font-semibold">ENS</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Ethereum Name Service</p>
                      <p className="text-sm text-vault-slate">Employee subdomains</p>
                    </div>
                  </div>
                  <Badge className="bg-vault-green text-white">Connected</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-vault-dark rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-yellow-500 font-semibold">Y</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Yellow Network</p>
                      <p className="text-sm text-vault-slate">Off-chain state channels</p>
                    </div>
                  </div>
                  <Badge className="bg-vault-green text-white">Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
