import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/api'

export async function POST(request: NextRequest) {
  const body = await request.json()
  return proxyToBackend('/api/organization/register/license', 'POST', body)
}
