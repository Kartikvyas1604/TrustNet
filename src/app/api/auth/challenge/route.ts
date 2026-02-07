import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// Store challenges temporarily (in production, use Redis)
const challenges = new Map<string, { challenge: string, timestamp: number }>()

// Clean up old challenges (older than 5 minutes)
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  for (const [key, value] of challenges.entries()) {
    if (value.timestamp < fiveMinutesAgo) {
      challenges.delete(key)
    }
  }
}, 60 * 1000) // Run every minute

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, identifier, walletAddress } = body

    if (!type || !identifier || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: type, identifier, walletAddress' },
        { status: 400 }
      )
    }

    // Generate a random challenge
    const challenge = `TrustNet Authentication\n\nSign this message to authenticate.\n\nType: ${type}\nID: ${identifier}\nWallet: ${walletAddress}\nNonce: ${randomBytes(16).toString('hex')}\nTimestamp: ${Date.now()}`

    // Store the challenge with a key combining type, identifier, and wallet
    const challengeKey = `${type}:${identifier}:${walletAddress.toLowerCase()}`
    challenges.set(challengeKey, {
      challenge,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      challenge
    })
  } catch (error: any) {
    console.error('Challenge generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    )
  }
}

// Export the challenges map for use in verify endpoint
export { challenges }
