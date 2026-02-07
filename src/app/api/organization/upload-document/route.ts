import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string
    const documentType = formData.get('documentType') as string

    if (!file || !organizationId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a new FormData for the backend
    const backendFormData = new FormData()
    backendFormData.append(documentType, file)
    
    // For single file upload, still send organizationId in the form
    backendFormData.append('organizationId', organizationId)

    // Upload to backend
    const response = await fetch(`${BACKEND_URL}/api/upload/single-document`, {
      method: 'POST',
      body: backendFormData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed')
    }

    return NextResponse.json({
      success: true,
      url: data.url,
      message: 'Document uploaded successfully',
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
