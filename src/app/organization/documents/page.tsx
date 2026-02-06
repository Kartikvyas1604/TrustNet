'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'

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
        alert('Documents uploaded successfully! Please proceed to payment.')
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
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
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
              <div className="flex flex-col items-center cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Click to upload
                </span>
              </div>
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 rounded p-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                <p className="text-xs text-gray-500">
                  {(fileData.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {fileData.uploaded ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : fileData.uploading ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
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
              className="ml-2"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}

        {fileData?.preview && (
          <div className="mt-3">
            <img
              src={fileData.preview}
              alt="Preview"
              className="max-w-full h-32 object-contain rounded border"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Upload KYC Documents</h1>
            <p className="text-gray-600">
              Please upload the required documents for verification. All documents will be reviewed by our admin team.
            </p>
          </div>

          {/* Important Notice */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Document Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All documents must be clear and readable</li>
                  <li>Documents must be recent (issued within last 6 months)</li>
                  <li>Accepted formats: PDF, JPG, PNG (max 5MB each)</li>
                  <li>Business Certificate is mandatory</li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Upload Sections */}
          <div className="space-y-6 mb-8">
            {renderFileUpload(
              'businessCertificate',
              'Business Registration Certificate',
              true
            )}
            {renderFileUpload(
              'proofOfAddress',
              'Proof of Business Address',
              false
            )}
            {renderFileUpload(
              'adminId',
              'Admin ID Document',
              false
            )}
            {renderFileUpload(
              'taxDocument',
              'Tax Registration Document',
              false
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={uploading || ! files.businessCertificate}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Documents & Continue to Payment'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={uploading}
            >
              Back
            </Button>
          </div>

          {/* Next Steps Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-semibold mb-2">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Upload your documents</li>
              <li>Complete payment (0.005 ETH on Base Sepolia)</li>
              <li>Admin will review your documents</li>
              <li>Once approved, your organization will be activated</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  )
}
