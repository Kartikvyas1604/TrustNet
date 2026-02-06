import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/api-proxy'

export async function POST(request: NextRequest) {
  const body = await request.json()
  return proxyToBackend('/api/organization/register/payment', 'POST', body)
}
