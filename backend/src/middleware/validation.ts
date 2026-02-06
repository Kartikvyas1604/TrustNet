import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import { UploadedFile } from 'express-fileupload'

// Organization registration validation schema
export const organizationRegistrationSchema = z.object({
  name: z.string().min(2).max(100),
  industry: z.string().min(2).max(50),
  country: z.string().length(2),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']),
  adminEmail: z.string().email(),
  adminName: z.string().min(2).max(100),
  adminWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40,64}$/),
})

// Employee onboarding validation schema
export const employeeOnboardingSchema = z.object({
  authKey: z.string().min(20).max(50),
  nickname: z.string().min(2).max(50),
  email: z.string().email(),
  jobTitle: z.string().min(2).max(100),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40,64}$/),
  signature: z.string(),
})

// Transaction validation schema
export const transactionSchema = z.object({
  senderId: z.string().uuid(),
  recipientAddress: z.string(),
  amount: z.number().positive(),
  token: z.enum(['USDC', 'SUI', 'ETH']),
  type: z.enum(['internal', 'external']),
})

// Payroll execution validation schema
export const payrollSchema = z.object({
  organizationId: z.string().uuid(),
  payments: z.array(z.object({
    employeeId: z.string().uuid(),
    amount: z.number().positive(),
  })).min(1),
})

// Validation middleware factory
export function validateRequest(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        })
      } else {
        res.status(500).json({ success: false, error: (error as Error).message })
      }
    }
  }
}

// Sanitize input to prevent XSS
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .trim()
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {}
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key])
      }
      return sanitized
    }
    return obj
  }

  req.body = sanitize(req.body)
  req.query = sanitize(req.query)
  req.params = sanitize(req.params)
  next()
}

// File upload validation
export function validateFileUpload(allowedTypes: string[], maxSizeMB: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const typedReq = req as Request & { files?: { [key: string]: UploadedFile | UploadedFile[] } }
    
    if (!typedReq.files || Object.keys(typedReq.files).length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' })
    }

    const files = Array.isArray(typedReq.files) ? typedReq.files : Object.values(typedReq.files)
    
    for (const file of files) {
      const fileArray = Array.isArray(file) ? file : [file]
      
      for (const f of fileArray) {
        const fileSize = f.size / (1024 * 1024) // Convert to MB
        const fileType = f.mimetype

        if (fileSize > maxSizeMB) {
          return res.status(400).json({
            success: false,
            error: `File ${f.name} exceeds maximum size of ${maxSizeMB}MB`,
          })
        }

        if (!allowedTypes.includes(fileType)) {
          return res.status(400).json({
            success: false,
            error: `File type ${fileType} not allowed`,
          })
        }
      }
    }

    next()
  }
}

// Amount validation (ensure sufficient balance)
export async function validateSufficientBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const { senderId, amount } = req.body
    
    // This would check actual balance from blockchain or database
    // Placeholder implementation
    const balance = 1000 // Get from blockchain/database

    if (amount > balance) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        details: { required: amount, available: balance },
      })
    }

    next()
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
}
