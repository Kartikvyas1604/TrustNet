import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'trustnet-secret-key-change-in-production'

export interface AuthRequest extends Request {
  user?: {
    id: string
    type: 'organization' | 'employee' | 'admin'
    organizationId?: string
  }
}

// Generate JWT token
export function generateToken(userId: string, userType: 'organization' | 'employee' | 'admin', organizationId?: string): string {
  return jwt.sign(
    { 
      id: userId, 
      type: userType,
      organizationId 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Authentication middleware
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' })
    }

    req.user = decoded
    next()
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// Require specific user type
export function requireUserType(...types: ('organization' | 'employee' | 'admin')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    if (!types.includes(req.user.type)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }

    next()
  }
}

// Require organization ownership or admin
export async function requireOrganizationAccess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const organizationId = req.params.id || req.body.organizationId

    if (req.user.type === 'admin') {
      return next()
    }

    if (req.user.type === 'organization' && req.user.id === organizationId) {
      return next()
    }

    if (req.user.type === 'employee' && req.user.organizationId === organizationId) {
      return next()
    }

    res.status(403).json({ success: false, error: 'Access denied' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const record = rateLimitMap.get(identifier)

    if (!record || now > record.resetTime) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
      return next()
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too many requests. Please try again later.' 
      })
    }

    record.count++
    next()
  }
}

// Wallet signature verification
export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    // In production, use proper signature verification library
    // For Sui: @mysten/sui.js
    // For Ethereum: ethers.js
    
    // Placeholder implementation
    const { ethers } = require('ethers')
    const recoveredAddress = ethers.utils.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase()
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// Challenge generation for wallet connection
export function generateChallenge(userId: string): string {
  const timestamp = Date.now()
  const nonce = Math.random().toString(36).substring(7)
  return `TrustNet Login Challenge:\nUser: ${userId}\nTimestamp: ${timestamp}\nNonce: ${nonce}`
}

// Session cleanup (run periodically)
export function cleanupExpiredSessions() {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 60000) // Run every minute
}
