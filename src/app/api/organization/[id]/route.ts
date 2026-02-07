import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const response = await fetch(`${BACKEND_URL}/api/organizations/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { success: false, error: text || `Backend error ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform backend response to frontend format
    return NextResponse.json({
      success: data.success,
      organization: data.data,
    })
  } catch (error: any) {
    console.error('Organization fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch organization details' 
      },
      { status: 500 }
    )
  }
}
