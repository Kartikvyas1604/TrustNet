'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, Upload, Check, X, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type DocumentType = 'business_certificate' | 'proof_of_address' | 'admin_id' | 'tax_document'

interface DocumentUpload {
  type: DocumentType
  name: string
  description: string
  file: File | null
  uploading: boolean
  uploaded: boolean
  url?: string
}

export default function OrganizationVerificationPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      type: 'business_certificate',
      name: 'Business Registration Certificate',
      description: 'Official certificate of incorporation or business registration',
      file: null,
      uploading: false,
      uploaded: false,
    },
    {
      type: 'proof_of_address',
      name: 'Proof of Business Address',
      description: 'Utility bill, lease agreement, or official document (< 3 months old)',
      file: null,
      uploading: false,
      uploaded: false,
    },
    {
      type: 'admin_id',
      name: 'Administrator ID',
      description: 'Government-issued ID of the primary administrator',
      file: null,
      uploading: false,
      uploaded: false,
    },
    {
      type: 'tax_document',
      name: 'Tax Registration Document',
      description: 'Tax ID certificate or EIN confirmation letter',
      file: null,
      uploading: false,
      uploaded: false,
    },
  ])

  useEffect(() => {
    const orgId = sessionStorage.getItem('organizationId')
    if (!orgId) {
      router.push('/organization/register')
      return
    }
    setOrganizationId(orgId)
  }, [router])

  const handleFileSelect = (index: number, file: File) => {
    const newDocuments = [...documents]
    newDocuments[index].file = file
    setDocuments(newDocuments)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      handleFileSelect(index, file)
    } else {
      alert('Please upload PDF or image files only')
    }
  }

  const uploadDocument = async (index: number) => {
    const doc = documents[index]
    if (!doc.file) return

    // Update uploading state
    const newDocuments = [...documents]
    newDocuments[index].uploading = true
    setDocuments(newDocuments)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', doc.file)
      formData.append('organizationId', organizationId)
      formData.append('documentType', doc.type)

      // Upload to backend
      const response = await fetch('/api/organization/upload-document', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        const updatedDocuments = [...documents]
        updatedDocuments[index].uploading = false
        updatedDocuments[index].uploaded = true
        updatedDocuments[index].url = data.url
        setDocuments(updatedDocuments)
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error: any) {
      alert('Upload error: ' + error.message)
      const updatedDocuments = [...documents]
      updatedDocuments[index].uploading = false
      setDocuments(updatedDocuments)
    }
  }

  const handleSubmit = async () => {
    const allUploaded = documents.every((doc) => doc.uploaded)
    if (!allUploaded) {
      alert('Please upload all required documents')
      return
    }

    setLoading(true)
    try {
      const kycDocuments = documents.map((doc) => ({
        type: doc.type,
        url: doc.url,
        name: doc.name,
      }))

      const response = await fetch('/api/organization/register/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          kycDocuments,
        }),
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.setItem('verificationSubmitted', 'true')
        router.push('/organization/register/wallet')
      } else {
        alert('Verification submission failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const allDocumentsUploaded = documents.every((doc) => doc.uploaded)

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-vault-slate hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">KYC Verification</h1>
          <p className="text-vault-slate">Upload required documents for verification</p>
        </div>

        {/* Info Alert */}
        <Card className="bg-blue-500/10 border-blue-500/20 mb-8">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-100">
                <p className="font-semibold mb-1">Document Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-200/80">
                  <li>All documents must be clear and legible</li>
                  <li>Accepted formats: PDF, JPG, PNG (max 10MB each)</li>
                  <li>Documents must be in English or include certified translation</li>
                  <li>Verification typically takes 1-3 business days</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Cards */}
        <div className="space-y-4 mb-8">
          {documents.map((doc, index) => (
            <Card
              key={doc.type}
              className="bg-vault-darker border-vault-slate/20"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg">{doc.name}</CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </div>
                  {doc.uploaded && (
                    <Badge className="bg-vault-green text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!doc.file ? (
                  <div
                    className="border-2 border-dashed border-vault-slate/30 rounded-lg p-8 text-center hover:border-vault-green/50 transition-colors cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => document.getElementById(`file-${index}`)?.click()}
                  >
                    <Upload className="w-12 h-12 text-vault-slate mx-auto mb-4" />
                    <p className="text-white font-medium mb-1">
                      Drop file here or click to upload
                    </p>
                    <p className="text-sm text-vault-slate">
                      PDF, JPG, or PNG (max 10MB)
                    </p>
                    <input
                      id={`file-${index}`}
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(index, file)
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-vault-dark rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-vault-green" />
                      <div>
                        <p className="text-white font-medium">{doc.file.name}</p>
                        <p className="text-sm text-vault-slate">
                          {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!doc.uploaded && !doc.uploading && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => uploadDocument(index)}
                            className="bg-vault-green hover:bg-vault-green/90"
                          >
                            Upload
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newDocuments = [...documents]
                              newDocuments[index].file = null
                              setDocuments(newDocuments)
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {doc.uploading && (
                        <Loader2 className="w-5 h-5 animate-spin text-vault-green" />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!allDocumentsUploaded || loading}
          className="w-full bg-vault-green hover:bg-vault-green/90 text-white h-12"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>Submit for Verification</>
          )}
        </Button>
      </div>
    </div>
  )
}
