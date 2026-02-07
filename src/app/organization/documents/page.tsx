'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle, Shield } from 'lucide-react'

interface UploadedFile {
  file: File
  preview?: string
  uploading: boolean
  uploaded: boolean
  error?: string
}

export default function DocumentUploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('orgId')

  const [files, setFiles] = useState<{
    businessCertificate?: UploadedFile
    proofOfAddress?: UploadedFile
    adminId?: UploadedFile
    taxDocument?: UploadedFile
  }>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileSelect = (field: string, file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setError('')
    
    // Create preview for images
    let preview: string | undefined
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }

    setFiles(prev => ({
      ...prev,
      [field]: {
        file,
        preview,
        uploading: false,
        uploaded: false,
      }
    }))
  }

  const handleUpload = async () => {
    if (!organizationId) {
      setError('Organization ID not found')
      return
    }

    // Check if at least business certificate is uploaded
    if (!files.businessCertificate) {
      setError('Business Certificate is required')
      return
    }

    try {
      setUploading(true)
      setError('')

      // Create FormData
      const formData = new FormData()
      formData.append('organizationId', organizationId)

      if (files.businessCertificate) {
        formData.append('businessCertificate', files.businessCertificate.file)
      }
      if (files.proofOfAddress) {
        formData.append('proofOfAddress', files.proofOfAddress.file)
      }
      if (files.adminId) {
        formData.append('adminId', files.adminId.file)
      }
      if (files.taxDocument) {
        formData.append('taxDocument', files.taxDocument.file)
      }

      const response = await fetch('http://localhost:5001/api/upload/kyc-documents', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        // Documents uploaded successfully, proceed to payment
        router.push(`/organization/payment?orgId=${organizationId}`)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      setError('Failed to upload documents. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const renderFileUpload = (
    field: string,
    label: string,
    required: boolean = false
  ) => {
    const fileData = files[field as keyof typeof files]

    return (
      <div className="border border-dashed border-vault-slate/20 rounded-lg p-6 hover:border-vault-green/50 transition-colors bg-vault-dark/50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-white">
              {label}
              {required && <span className="text-red-400 ml-1">*</span>}
            </h3>
            <p className="text-sm text-vault-slate mt-1">
              PDF, JPG, or PNG (max 5MB)
            </p>
          </div>
        </div>

        {!fileData ? (
          <div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(field, file)
              }}
              className="hidden"
              id={`file-${field}`}
            />
            <label htmlFor={`file-${field}`}>
              <div className="flex flex-col items-center cursor-pointer py-4">
                <div className="w-12 h-12 rounded-full bg-vault-green/10 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-vault-green" />
                </div>
                <span className="text-sm font-medium text-vault-green hover:text-vault-green/80">
                  Click to upload document
                </span>
              </div>
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-vault-dark rounded p-3 border border-vault-slate/10">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{fileData.file.name}</p>
                <p className="text-xs text-vault-slate">
                  {(fileData.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {fileData.uploaded ? (
                <CheckCircle className="w-5 h-5 text-vault-green flex-shrink-0" />
              ) : fileData.uploading ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
              ) : null}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFiles(prev => {
                  const newFiles = { ...prev }
                  delete newFiles[field as keyof typeof files]
                  return newFiles
                })
              }}
              className="ml-2 text-vault-slate hover:text-red-400 hover:bg-red-500/10"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}

        {fileData?.preview && (
          <div className="mt-4">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-vault-slate/20 bg-vault-dark">
              <img
                src={fileData.preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark via-vault-dark/95 to-vault-dark/90 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload KYC Documents</h1>
          <p className="text-vault-slate">
            Please provide the following documents to verify your organization identity.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {renderFileUpload('businessCertificate', 'Business Registration Certificate', true)}
          {renderFileUpload('proofOfAddress', 'Proof of Business Address')}
          {renderFileUpload('adminId', 'Admin Government ID')}
          {renderFileUpload('taxDocument', 'Tax Registration Document')}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-400 text-sm mb-1">Data Privacy & Security</h4>
              <p className="text-sm text-vault-slate">
                Your documents are encrypted and stored securely. They are only accessible by our 
                compliance team for verification purposes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-vault-slate/20 text-white hover:bg-vault-slate/10"
          >
            Back
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || !files.businessCertificate}
            className="bg-vault-green text-vault-dark hover:bg-vault-green/90 min-w-[150px]"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Submit Documents'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
