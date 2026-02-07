import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

// Import the challenges map (in production, use Redis)
const challenges = new Map<string, { challenge: string, timestamp: number }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, identifier, walletAddress, signature, challenge } = body

    if (!type || !identifier || !walletAddress || !signature || !challenge) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const challengeKey = `${type}:${identifier}:${walletAddress.toLowerCase()}`
    
    // Verify challenge exists and matches
    const storedChallenge = challenges.get(challengeKey)
    if (!storedChallenge || storedChallenge.challenge !== challenge) {
      return NextResponse.json(
        { error: 'Invalid or expired challenge' },
        { status: 401 }
      )
    }

    // Check if challenge is not too old (5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    if (storedChallenge.timestamp < fiveMinutesAgo) {
      challenges.delete(challengeKey)
      return NextResponse.json(
        { error: 'Challenge expired' },
        { status: 401 }
      )
    }

    // Verify the signature
    try {
      const recoveredAddress = ethers.verifyMessage(challenge, signature)
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 401 }
        )
      }
    } catch (err) {
      console.error('Signature verification error:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Delete used challenge
    challenges.delete(challengeKey)

    // Return success
    return NextResponse.json({
      success: true,
      verified: true,
      type,
      identifier,
      walletAddress
    })
  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
