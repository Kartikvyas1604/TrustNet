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
  AlertCircle,
  User
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
  const [employeeLimit, setEmployeeLimit] = useState<number>(10)
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

      // Get organization details including employee limit
      const orgResponse = await fetch(`/api/organization/${orgId}`)
      const orgData = await orgResponse.json()
      if (orgData.success && orgData.organization) {
        setEmployeeLimit(orgData.organization.employeeLimit || 10)
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
    const remainingSlots = employeeLimit - authKeys.length
    const defaultCount = Math.min(10, remainingSlots)
    
    const count = prompt(
      `How many auth keys to generate?\n\nYour subscription allows ${employeeLimit} employees.\nYou have ${authKeys.length} keys (${remainingSlots} slots remaining).`,
      defaultCount.toString()
    )
    
    if (!count || isNaN(parseInt(count))) return

    const requestedCount = parseInt(count)
    
    if (requestedCount > remainingSlots) {
      alert(`You can only generate ${remainingSlots} more keys. Upgrade your subscription for more employees.`)
      return
    }

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
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(''), 2000)
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      alert('Failed to copy. Please select and copy manually.')
    })
  }

  const downloadKeys = () => {
    const keysText = newlyGeneratedKeys.map((k, i) => `Key ${i + 1}: ${k.key}`).join('\n')
    const blob = new Blob([keysText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trustnet-auth-keys-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyAllKeys = async () => {
    const keysText = newlyGeneratedKeys.map(k => k.key).join('\n')
    try {
      await navigator.clipboard.writeText(keysText)
      // Show success feedback
      const originalText = newlyGeneratedKeys.length > 0 ? newlyGeneratedKeys[0].key : ''
      setCopiedKey('ALL_KEYS_COPIED')
      setTimeout(() => setCopiedKey(''), 2000)
      alert(`✅ Copied ${newlyGeneratedKeys.length} keys to clipboard!\\n\\nYou can now paste them into an email or document.`)
    } catch (err) {
      alert('❌ Failed to copy. Please use the download button instead or copy keys individually.')
    }
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
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-sm text-blue-100 font-medium mb-1">
                    📋 How to share these keys with employees:
                  </p>
                  <ol className="text-xs text-blue-200/80 list-decimal list-inside space-y-1">
                    <li>Click the copy icon next to each key OR click "Copy All Keys"</li>
                    <li>Send keys securely to employees via email or HR system</li>
                    <li>Employees use these keys at <span className="font-mono text-blue-100">/auth</span> to login</li>
                    <li>Each key can only be used once</li>
                  </ol>
                </div>
                
                <div className="bg-vault-dark/50 p-4 rounded-lg space-y-2 max-h-96 overflow-y-auto">
                  {newlyGeneratedKeys.map((keyObj, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-vault-dark rounded hover:bg-vault-dark/80 transition-colors">
                      <div className="flex-1 min-w-0">
                        <code 
                          className="text-vault-green font-mono text-base block break-all cursor-text"
                          onClick={(e) => {
                            // Select the text when clicked
                            const range = document.createRange()
                            range.selectNodeContents(e.currentTarget)
                            const selection = window.getSelection()
                            selection?.removeAllRanges()
                            selection?.addRange(range)
                          }}
                        >
                          {keyObj.key}
                        </code>
                        <p className="text-xs text-vault-slate/60 mt-1">Key #{index + 1} (click text to select)</p>
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-vault-slate/20 hover:border-vault-green/50 flex-shrink-0"
                        onClick={() => copyKey(keyObj.key)}
                        title="Copy this key"
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
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button
                      onClick={copyAllKeys}
                      variant="outline"
                      className="flex-1 border-vault-green/30 hover:bg-vault-green/10 hover:border-vault-green"
                    >
                      {copiedKey === 'ALL_KEYS_COPIED' ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-vault-green" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy All {newlyGeneratedKeys.length} Keys
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={downloadKeys}
                      className="flex-1 bg-vault-green text-vault-dark hover:bg-vault-green/90"
                    >
                      💾 Download as .txt
                    </Button>
                  </div>
                  <Button
                    onClick={closeKeysModal}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    I've Saved These Keys
                  </Button>
                  <p className="text-xs text-center text-vault-slate/70">
                    ⚠️ These keys will never be shown again after closing this window
                  </p>
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
            disabled={generating || authKeys.length >= employeeLimit}
            className="bg-vault-green hover:bg-vault-green/90 disabled:opacity-50"
            title={authKeys.length >= employeeLimit ? "Employee limit reached" : "Generate new keys (shown once in popup)"}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate New Keys\u2192 Popup
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
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

          <Card className="bg-vault-darker border-vault-slate/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{employeeLimit}</p>
                  <p className="text-sm text-vault-slate">Employee Limit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Limit Progress Bar */}
        <Card className="bg-vault-darker border-vault-slate/20 mb-8">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-vault-slate">Subscription Usage</span>
                <span className="text-white font-semibold">
                  {authKeys.length} / {employeeLimit} employees
                </span>
              </div>
              <div className="w-full bg-vault-dark rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    authKeys.length >= employeeLimit
                      ? 'bg-red-500'
                      : authKeys.length >= employeeLimit * 0.8
                      ? 'bg-yellow-500'
                      : 'bg-vault-green'
                  }`}
                  style={{ width: `${Math.min((authKeys.length / employeeLimit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-vault-slate/70">
                {authKeys.length >= employeeLimit ? (
                  <span className="text-red-400 font-semibold">
                    Limit reached! Upgrade your subscription to add more employees.
                  </span>
                ) : (
                  `You can generate ${employeeLimit - authKeys.length} more keys.`
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Card className="bg-amber-500/10 border-amber-500/30 mb-8">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-100">
                <p className="font-bold text-amber-300 mb-2 text-base">⚠️ IMPORTANT: Keys can only be copied during generation!</p>
                <ul className="list-disc list-inside space-y-1.5 text-amber-200/90">
                  <li><strong>The list below shows encrypted key hashes</strong> - these CANNOT be used for login</li>
                  <li><strong>Actual keys are shown only once</strong> in a popup immediately after clicking "Generate Keys"</li>
                  <li>You MUST copy/download keys from that popup before closing it</li>
                  <li>If you closed the popup without saving, you need to generate new keys</li>
                  <li>Each key is single-use and works at <span className="font-mono bg-amber-500/20 px-1 rounded">/auth</span> page</li>
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
              <h3 className="text-xl font-semibold text-white mb-2">No Auth Keys Generated Yet</h3>
              <p className="text-vault-slate mb-6 max-w-md mx-auto">
                Generate auth keys to allow employees to onboard. <strong className="text-amber-400">Keys will be shown once in a popup</strong> - make sure to copy them!
              </p>
              <Button
                onClick={generateKeys}
                disabled={generating}
                className="bg-vault-green hover:bg-vault-green/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate Your First Keys
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

                      {/* Key Hash (NOT the actual usable key) */}
                      <div className="flex-1">
                        <div className="flex flex-col gap-1.5 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">
                              \u26d4 Encrypted Hash (Not Usable)
                            </span>
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
                          <code className="text-vault-slate/60 font-mono text-xs block truncate max-w-md" title={authKey.keyHash}>
                            {authKey.keyHash}
                          </code>
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
