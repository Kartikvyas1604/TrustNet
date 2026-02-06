import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, keyId: string }> }
) {
  try {
    const { id, keyId } = await params
    const response = await fetch(
      `${BACKEND_URL}/api/organization/${id}/auth-keys/${keyId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
