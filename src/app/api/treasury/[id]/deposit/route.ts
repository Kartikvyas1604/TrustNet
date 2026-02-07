import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/treasury/${id}/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    
    // Transform backend response to frontend format
    return NextResponse.json({
      success: data.success,
      address: data.data?.address,
      chain: data.data?.chain,
      currency: data.data?.currency,
      minDeposit: data.data?.minDeposit,
      message: data.data?.message,
    })
  } catch (error: any) {
    console.error('Deposit address API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
