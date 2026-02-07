import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.tempToken || !body.walletAddress) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          errors: [
            ...(!body.tempToken ? [{ msg: 'Temp token is required', param: 'tempToken' }] : []),
            ...(!body.walletAddress ? [{ msg: 'Wallet address is required', param: 'walletAddress' }] : [])
          ]
        },
        { status: 400 }
      )
    }

    console.log('Proxying wallet connection request to backend:', {
      hasToken: !!body.tempToken,
      walletAddress: body.walletAddress
    })

    const response = await fetch(`${BACKEND_URL}/api/employee/connect-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Backend error:', response.status, data)
    }
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
