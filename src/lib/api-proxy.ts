import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function proxyToBackend(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
  body?: any
) {
  const url = `${BACKEND_URL}${endpoint}`
  console.log('🔵 [API PROXY] Starting request to:', url)
  console.log('🔵 [API PROXY] Method:', method)
  console.log('🔵 [API PROXY] BACKEND_URL:', BACKEND_URL)
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    }

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body)
      console.log('📤 [API PROXY] Request body keys:', Object.keys(body))
    }

    console.log('⏳ [API PROXY] Sending fetch request...')
    const response = await fetch(url, options)
    console.log('📥 [API PROXY] Got response! Status:', response.status, response.statusText)
    console.log('📥 [API PROXY] Response headers:', Object.fromEntries(response.headers.entries()))

    const text = await response.text()
    console.log('📥 [API PROXY] Response text length:', text.length)
    console.log('📥 [API PROXY] Response text:', text.substring(0, 500))
    
    if (!text || !text.trim()) {
      console.error('⚠️ [API PROXY] Empty response body!')
      return NextResponse.json(
        { success: false, error: `Empty response from backend (status: ${response.status})` }, 
        { status: response.status || 500 }
      )
    }
    
    try {
      const data = JSON.parse(text)
      console.log('✅ [API PROXY] Successfully parsed JSON')
      return NextResponse.json(data, { status: response.status })
    } catch (parseError) {
      console.error('❌ [API PROXY] JSON Parse Error:', parseError)
      return NextResponse.json(
        { success: false, error: `Invalid JSON: ${text.substring(0, 200)}` },
        { status: 500 }
      )
    }
    
  } catch (error: any) {
    console.error('❌ [API PROXY] Caught error:', error)
    console.error('❌ [API PROXY] Error name:', error.name)
    console.error('❌ [API PROXY] Error message:', error.message)
    console.error('❌ [API PROXY] Error cause:', error.cause)
    
    let errorMessage = 'Unknown error'
    if (error.name === 'AbortError') {
      errorMessage = 'Backend request timed out after 10 seconds'
    } else if (error.cause?.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to backend on port 5001 - is it running?'
    } else {
      errorMessage = error.message || 'Network error'
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage, details: error.toString() },
      { status: 500 }
    )
  }
}
