import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function proxyToBackend(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
  body?: any
) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, options)

    // Try to get response text first
    const text = await response.text()
    
    // Log for debugging
    console.error('Backend response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: text.substring(0, 500)
    })
    
    // Try to parse as JSON
    let data: any
    if (text && text.trim()) {
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        return NextResponse.json(
          { success: false, error: `Backend returned invalid JSON: ${text.substring(0, 200)}` },
          { status: response.status }
        )
      }
    }
    
    // Return the actual backend response
    return NextResponse.json(data || { success: false, error: 'Empty response' }, { status: response.status })
    
  } catch (error: any) {
    // Connection error or other failure
    console.error('Backend Proxy Error:', error)
    
    const errorMessage = error.cause?.code === 'ECONNREFUSED'
      ? 'Backend server is not running. Please start the backend on port 5001.'
      : error.message || 'An unexpected error occurred'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
