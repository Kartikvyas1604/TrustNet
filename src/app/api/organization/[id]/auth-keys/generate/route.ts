import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Call the correct backend endpoint (plural "organizations")
    const response = await fetch(`${BACKEND_URL}/api/organizations/${id}/generate-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // Check if response is OK before parsing JSON
    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { 
          success: false, 
          error: text || `Backend returned ${response.status}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform backend response to match frontend expectations
    return NextResponse.json({
      success: data.success,
      generated: data.data?.keys?.length || 0,
      keys: data.data?.keys || [],
      message: data.data?.message,
    })
  } catch (error: any) {
    console.error('Auth key generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate auth keys' 
      },
      { status: 500 }
    )
  }
}
