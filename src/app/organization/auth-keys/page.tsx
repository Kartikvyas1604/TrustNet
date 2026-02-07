'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Key, 
  ArrowLeft, 
  Loader2, 
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AuthKey {
  id: string
  key?: string // Only available for newly generated keys
  keyHash: string
  status?: string // Backend returns 'status' instead of 'used'
  used?: boolean // For compatibility
  usedBy?: string
  usedAt?: string
  assignedEmployeeId?: string
  generatedAt?: string
  createdAt?: string
}

interface NewlyGeneratedKey {
  key: string
  keyHash: string
}

export default function OrganizationAuthKeysPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [authKeys, setAuthKeys] = useState<AuthKey[]>([])
  const [newlyGeneratedKeys, setNewlyGeneratedKeys] = useState<NewlyGeneratedKey[]>([])
  const [showKeysModal, setShowKeysModal] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState('')

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register')
      return
    }
    setOrganizationId(orgId)
    checkStatusAndLoadKeys(orgId)
  }, [router])

  const checkStatusAndLoadKeys = async (orgId: string) => {
    try {
      // Check organization status first
      const statusResponse = await fetch(`/api/organization/status/${orgId}`)
      const statusData = await statusResponse.json()

      if (statusData.success && statusData.organization.kycStatus !== 'APPROVED') {
        router.push('/organization/pending')
        return
      }

      // Load auth keys
      await loadAuthKeys(orgId)
    } catch (error) {
      console.error('Failed to load auth keys:', error)
      setLoading(false)
    }
  }

  const loadAuthKeys = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organization/${orgId}/auth-keys`)
      const data = await response.json()

      if (data.success) {
        setAuthKeys(data.authKeys)
      }
    } catch (error) {
      console.error('Failed to load auth keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateKeys = async () => {
    const count = prompt('How many auth keys to generate?', '10')
    if (!count || isNaN(parseInt(count))) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/organization/${organizationId}/auth-keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: parseInt(count) }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.keys && data.keys.length > 0) {
        // Store newly generated keys to show in modal
        setNewlyGeneratedKeys(data.keys)
        setShowKeysModal(true)
        // Reload the list to show updated counts
        await loadAuthKeys(organizationId)
      } else {
        alert('Generation failed: ' + (data.error || 'No keys returned'))
      }
    } catch (error: any) {
      console.error('Key generation error:', error)
      alert('Error generating keys: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const revokeKey = async (keyId: string) => {
    if (!confirm('Revoke this auth key? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/organization/${organizationId}/auth-keys/${keyId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('Auth key revoked successfully')
        loadAuthKeys(organizationId)
      } else {
        alert('Revocation failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  const downloadKeys = () => {
    const keysText = newlyGeneratedKeys.map(k => k.key).join('\n')
    const blob = new Blob([keysText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auth-keys-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const closeKeysModal = () => {
    if (confirm('Have you saved these keys? They cannot be retrieved again!')) {
      setShowKeysModal(false)
      setNewlyGeneratedKeys([])
    }
  }

  const availableKeys = authKeys.filter((k) => k.status === 'UNUSED' || (!k.status && !k.used)).length
  const usedKeys = authKeys.filter((k) => k.status === 'ACTIVE' || k.used).length

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

        {/* Modal for newly generated keys */}
        {showKeysModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="bg-vault-darker border-vault-green/50 max-w-2xl w-full max-h-[80vh] overflow-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Key className="w-6 h-6 text-vault-green" />
                  Auth Keys Generated Successfully!
                </CardTitle>
                <CardDescription className="text-red-400 font-semibold">
                  ⚠️ SAVE THESE KEYS NOW - They cannot be retrieved again!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-vault-dark/50 p-4 rounded-lg space-y-2">
                  {newlyGeneratedKeys.map((keyObj, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-vault-dark rounded">
                      <code className="text-vault-green font-mono text-sm flex-1">
                        {keyObj.key}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-vault-slate/20"
                        onClick={() => copyKey(keyObj.key)}
                      >
                        {copiedKey === keyObj.key ? (
                          <Check className="w-4 h-4 text-vault-green" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={downloadKeys}
                    className="flex-1 bg-vault-green hover:bg-vault-green/90"
                  >
                    Download Keys
                  </Button>
                  <Button
                    onClick={closeKeysModal}
                    variant="outline"
                    className="flex-1 border-vault-slate/20"
                  >
                    I've Saved These Keys
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Auth Keys</h1>
            <p className="text-vault-slate">Manage employee authentication keys</p>
          </div>
          <Button
            onClick={generateKeys}
            disabled={generating}
            className="bg-vault-green hover:bg-vault-green/90"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate Keys
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-vault-green/20 flex items-center justify-center">
                  <Key className="w-6 h-6 text-vault-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{authKeys.length}</p>
                  <p className="text-sm text-vault-slate">Total Keys</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{availableKeys}</p>
                  <p className="text-sm text-vault-slate">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{usedKeys}</p>
                  <p className="text-sm text-vault-slate">Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        <Card className="bg-blue-500/10 border-blue-500/20 mb-8">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-100">
                <p className="font-semibold mb-1">About Auth Keys:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-200/80">
                  <li>Each employee needs one unique auth key to onboard</li>
                  <li><strong>Keys are shown only once</strong> - save them immediately after generation</li>
                  <li>Keys are single-use and cannot be reused once claimed</li>
                  <li>Share keys securely via email or other private channels</li>
                  <li>The list below shows key hashes and status, not the actual keys</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auth Keys List */}
        {authKeys.length === 0 ? (
          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-12 text-center">
              <Key className="w-16 h-16 text-vault-slate mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Auth Keys Yet</h3>
              <p className="text-vault-slate mb-4">
                Generate auth keys to allow employees to onboard
              </p>
              <Button
                onClick={generateKeys}
                disabled={generating}
                className="bg-vault-green hover:bg-vault-green/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate Keys
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {authKeys.map((authKey, index) => (
              <motion.div
                key={authKey.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="bg-vault-darker border-vault-slate/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Key Icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          authKey.used ? 'bg-yellow-500/20' : 'bg-vault-green/20'
                        }`}
                      >
                        <Key
                          className={`w-5 h-5 ${
                            authKey.used ? 'text-yellow-500' : 'text-vault-green'
                          }`}
                        />
                      </div>

                      {/* Key Value */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-vault-slate font-mono text-xs">
                            {authKey.keyHash}
                          </code>
                          <Badge
                            className={
                              authKey.status === 'UNUSED' || (!authKey.status && !authKey.used)
                                ? 'bg-vault-green/20 text-vault-green'
                                : 'bg-yellow-500/20 text-yellow-500'
                            }
                          >
                            {authKey.status || (authKey.used ? 'ACTIVE' : 'UNUSED')}
                          </Badge>
                        </div>
                        <p className="text-xs text-vault-slate">
                          Created {new Date(authKey.generatedAt || authKey.createdAt || Date.now()).toLocaleString()}
                          {(authKey.status === 'ACTIVE' || authKey.used) && authKey.assignedEmployeeId && (
                            <> • Employee: {authKey.assignedEmployeeId}</>
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {(authKey.status === 'UNUSED' || (!authKey.status && !authKey.used)) && (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              className="border-vault-slate/20 text-red-400 hover:bg-red-500/10"
                              onClick={() => revokeKey(authKey.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
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
