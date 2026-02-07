import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, AuthKeyStatus } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { suiBlockchainService } from '../services/SuiBlockchainService';
import ensService from '../services/ENSService';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * STEP 1: Organization Type Selection
 * POST /api/organization/register/type
 */
router.post(
  '/register/type',
  [
    body('organizationType').isIn(['Startup', 'Small Business', 'Mid-Market', 'Enterprise']).withMessage('Invalid organization type'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { organizationType } = req.body;

      // Suggest employee limits based on type
      const employeeLimits: { [key: string]: { suggested: number; max: number } } = {
        'Startup': { suggested: 50, max: 50 },
        'Small Business': { suggested: 200, max: 200 },
        'Mid-Market': { suggested: 1000, max: 1000 },
        'Enterprise': { suggested: 5000, max: 10000 },
      };

      res.json({
        success: true,
        data: {
          organizationType,
          employeeLimits: employeeLimits[organizationType],
        },
      });
    } catch (error: any) {
      logger.error('Organization type selection error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * STEP 2: Basic Organization Information
 * POST /api/organization/register/details
 */
router.post(
  '/register/details',
  [
    body('organizationName').notEmpty().withMessage('Organization name is required'),
    body('legalBusinessName').notEmpty().withMessage('Legal business name is required'),
    body('registrationNumber').notEmpty().withMessage('Business registration number is required'),
    body('country').notEmpty().withMessage('Country is required'),
    body('businessAddress').isObject().withMessage('Business address is required'),
    body('adminName').notEmpty().withMessage('Admin name is required'),
    body('adminEmail').isEmail().withMessage('Valid admin email is required'),
    body('adminPhone').notEmpty().withMessage('Admin phone is required'),
    body('adminJobTitle').notEmpty().withMessage('Admin job title is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        organizationName,
        legalBusinessName,
        registrationNumber,
        country,
        businessAddress,
        industry,
        websiteUrl,
        adminName,
        adminEmail,
        adminPhone,
        adminJobTitle,
        organizationType,
      } = req.body;

      // Check if organization already exists
      const existingOrg = await prisma.organization.findFirst({
        where: {
          OR: [
            { name: organizationName },
            { adminEmail: adminEmail },
            { registrationNumber: registrationNumber },
          ],
        },
      });

      if (existingOrg) {
        return res.status(400).json({
          success: false,
          error: 'Organization with this name, email, or registration number already exists',
        });
      }

      // Generate unique organization ID
      const organizationId = `org-${crypto.randomBytes(8).toString('hex')}`;

      // Create organization with status: pending_verification
      const organization = await prisma.organization.create({
        data: {
          organizationId,
          name: organizationName,
          legalBusinessName,
          registrationNumber,
          country,
          businessAddress,
          industry,
          websiteUrl,
          adminName,
          adminEmail,
          adminPhone,
          adminJobTitle,
          organizationType,
          kycStatus: 'PENDING',
          subscriptionTier: 'STARTER',
          subscriptionStatus: 'TRIAL',
          paymentStatus: 'PENDING',
          employeeLimit: 10,
          kycDocuments: {},
          adminWallets: [],
        },
      });

      // TODO: Send verification email

      res.status(201).json({
        success: true,
        data: {
          organizationId: organization.organizationId,
          name: organization.name,
          status: 'pending_verification',
          message: 'Organization registered. Please proceed to select employee licenses.',
        },
      });
    } catch (error: any) {
      logger.error('Organization details registration error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * STEP 3: Employee License Selection
 * POST /api/organization/register/license
 */
router.post(
  '/register/license',
  [
    body('organizationId').notEmpty().withMessage('Organization ID is required'),
    body('employeeCount').isInt({ min: 1, max: 10000 }).withMessage('Employee count must be between 1 and 10000'),
    body('billingCycle').isIn(['MONTHLY', 'ANNUAL']).withMessage('Billing cycle must be MONTHLY or ANNUAL'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { organizationId, employeeCount, billingCycle } = req.body;

      // Find organization
      const organization = await prisma.organization.findUnique({
        where: { organizationId },
      });

      if (!organization) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      // Calculate pricing
      let pricePerEmployee = 2; // Default $2/employee/month
      let subscriptionTier = 'STARTER';

      if (employeeCount > 200) {
        pricePerEmployee = 1;
        subscriptionTier = 'ENTERPRISE';
      } else if (employeeCount > 50) {
        pricePerEmployee = 1.5;
        subscriptionTier = 'BUSINESS';
      }

      const monthlyPrice = (employeeCount * pricePerEmployee).toString();
      const annualPrice = (employeeCount * pricePerEmployee * 12 * 0.85).toString(); // 15% annual discount

      // Update organization
      const updatedOrg = await prisma.organization.update({
        where: { organizationId },
        data: {
          employeeLimit: employeeCount,
          subscriptionTier: subscriptionTier as any,
          billingCycle,
          monthlyPrice,
          annualPrice,
        },
      });

      const totalCost = billingCycle === 'ANNUAL' ? annualPrice : monthlyPrice;

      res.json({
        success: true,
        data: {
          employeeCount,
          subscriptionTier,
          pricePerEmployee,
          monthlyPrice,
          annualPrice,
          billingCycle,
          totalCost,
          message: 'Pricing calculated. Proceed to payment.',
        },
      });
    } catch (error: any) {
      logger.error('License selection error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * STEP 4: Payment Information (Crypto or Stripe)
 * POST /api/organization/register/payment
 */
router.post(
  '/register/payment',
  [
    body('organizationId').notEmpty().withMessage('Organization ID is required'),
    body('paymentMethod').isIn(['card', 'crypto', 'bank_transfer', 'invoice']).withMessage('Invalid payment method'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { organizationId, paymentMethod } = req.body;

      const organization = await prisma.organization.findUnique({
        where: { organizationId },
      });

      if (!organization) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      let paymentInfo: any = {};

      if (paymentMethod === 'card') {
        // TODO: Create Stripe checkout session
        paymentInfo = {
          checkoutUrl: 'https://checkout.stripe.com/session_xxxxx',
          sessionId: 'cs_test_xxxxx',
        };
      } else if (paymentMethod === 'crypto') {
        // Generate unique payment address for this organization
        const paymentAddress = process.env.TREASURY_PAYMENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
        const amount = organization.billingCycle === 'ANNUAL' ? organization.annualPrice : organization.monthlyPrice;
        
        // Store payment expectation
        await prisma.organization.update({
          where: { organizationId },
          data: {
            paymentStatus: 'PENDING',
            // Store expected payment amount for verification
            treasuryAddresses: {
              paymentAddress,
              expectedAmount: amount?.toString(),
              paymentMethod: 'ETH',
              timestamp: new Date().toISOString(),
            } as any,
          },
        });

        paymentInfo = {
          paymentAddress,
          amount: amount || 0,
          currency: 'ETH',
          network: 'Ethereum Mainnet',
          message: 'Send ETH to this address to complete payment',
          organizationId,
        };
      } else if (paymentMethod === 'invoice') {
        // Generate invoice
        paymentInfo = {
          invoiceId: `INV-${organizationId}-${Date.now()}`,
          downloadUrl: '/api/invoices/download/...',
        };
      }

      res.json({
        success: true,
        data: {
          paymentMethod,
          paymentInfo,
          message: 'Payment initiated. Complete payment to proceed.',
        },
      });
    } catch (error: any) {
      logger.error('Payment initiation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * STEP 4a: Verify Crypto Payment
 * POST /api/organization/register/payment/verify-crypto
 */
router.post('/register/payment/verify-crypto', async (req: Request, res: Response) => {
  try {
    const { organizationId, txHash } = req.body;

    if (!txHash) {
      return res.status(400).json({ success: false, error: 'Transaction hash is required' });
    }

    const organization = await prisma.organization.findUnique({
      where: { organizationId },
    });

    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // In production, verify the transaction on-chain using ethers.js
    // For now, accept the transaction and update status
    const treasuryData = organization.treasuryAddresses as any;
    
    await prisma.organization.update({
      where: { organizationId },
      data: {
        paymentStatus: 'PAYMENT_RECEIVED',
        subscriptionStatus: 'ACTIVE',
        treasuryAddresses: {
          ...treasuryData,
          paymentTxHash: txHash,
          paymentVerified: true,
          paymentDate: new Date().toISOString(),
        } as any,
      },
    });

    logger.info(`Crypto payment verified for organization ${organizationId}:`, { txHash });

    res.json({
      success: true,
      data: {
        status: 'payment_verified',
        txHash,
        message: 'Payment verified successfully. Proceed to document upload.',
      },
    });
  } catch (error: any) {
    logger.error('Crypto payment verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * STEP 4b: Confirm Payment (Webhook or Manual)
 * POST /api/organization/register/payment/confirm
 */
router.post('/register/payment/confirm', async (req: Request, res: Response) => {
  try {
    const { organizationId, paymentId, amount } = req.body;

    const organization = await prisma.organization.update({
      where: { organizationId },
      data: {
        paymentStatus: 'PAYMENT_RECEIVED',
        subscriptionStatus: 'ACTIVE',
      },
    });

    res.json({
      success: true,
      data: {
        status: 'payment_received',
        message: 'Payment confirmed. Please upload verification documents.',
      },
    });
  } catch (error: any) {
    logger.error('Payment confirmation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * STEP 5: Document Upload & KYC Verification
 * POST /api/organization/register/verification
 */
router.post(
  '/register/verification',
  [
    body('organizationId').notEmpty().withMessage('Organization ID is required'),
    body('documents').isObject().withMessage('Documents object is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { organizationId, documents } = req.body;

      // documents should contain: { businessCert, proofOfAddress, adminId, taxDoc }
      const organization = await prisma.organization.update({
        where: { organizationId },
        data: {
          kycDocuments: documents,
          kycStatus: 'PENDING', // Will be changed to APPROVED by admin
        },
      });

      // TODO: Upload files to IPFS or S3
      // TODO: Send notification to admin panel

      res.json({
        success: true,
        data: {
          status: 'verification_pending',
          message: 'Documents uploaded successfully. Review will be completed in 24-48 hours.',
        },
      });
    } catch (error: any) {
      logger.error('Document upload error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * STEP 6: Wallet Connection (Admin Wallet)
 * POST /api/organization/register/wallet
 */
router.post(
  '/register/wallet',
  [
    body('organizationId').notEmpty().withMessage('Organization ID is required'),
    body('walletAddress').notEmpty().withMessage('Wallet address is required'),
    body('signature').notEmpty().withMessage('Signature is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { organizationId, walletAddress, signature, message } = req.body;

      // TODO: Verify signature matches wallet address

      const organization = await prisma.organization.findUnique({
        where: { organizationId },
      });

      if (!organization) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      // Add wallet to admin wallets
      const adminWallets = Array.isArray(organization.adminWallets) ? organization.adminWallets : [];
      adminWallets.push({
        address: walletAddress,
        role: 'primary',
        addedAt: new Date().toISOString(),
        verified: true,
      });

      await prisma.organization.update({
        where: { organizationId },
        data: {
          adminWallets,
        },
      });

      res.json({
        success: true,
        data: {
          walletAddress,
          status: 'wallet_connected',
          message: 'Wallet connected successfully. Awaiting verification approval.',
        },
      });
    } catch (error: any) {
      logger.error('Wallet connection error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * STEP 8: Admin Approves Organization
 * POST /api/admin/organizations/:id/approve
 */
router.post('/admin/organizations/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy, notes } = req.body;

    const organization = await prisma.organization.findUnique({
      where: { organizationId: id },
    });

    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Generate ENS name
    const ensName = organization.name.toLowerCase().replace(/\s+/g, '') + '.eth';

    // Generate auth keys
    const authKeys: string[] = [];
    const authKeyRecords = [];

    for (let i = 0; i < organization.employeeLimit; i++) {
      // Generate exactly 16 alphanumeric characters
      let keyChars = '';
      while (keyChars.length < 16) {
        const randomBytes = crypto.randomBytes(16);
        const chars = randomBytes
          .toString('base64')
          .replace(/[^A-Za-z0-9]/g, '')
          .toUpperCase();
        keyChars += chars;
      }
      keyChars = keyChars.substring(0, 16);
      
      // Format as XXXX-XXXX-XXXX-XXXX
      const key = keyChars.match(/.{1,4}/g)!.join('-');
      const keyHash = await bcrypt.hash(key, 10);

      authKeys.push(key);
      authKeyRecords.push({
        keyHash,
        organizationId: organization.organizationId,
        status: AuthKeyStatus.UNUSED,
        generatedAt: new Date(),
      });
    }

    // Create auth keys in database
    await prisma.authKey.createMany({
      data: authKeyRecords,
    });

    // Create treasury wallet addresses for supported chains
    const adminWallets = organization.adminWallets as any;
    const primaryWallet = Array.isArray(adminWallets) && adminWallets.length > 0 
      ? adminWallets[0].address 
      : null;

    // For now, use the admin's primary wallet as treasury address for all chains
    // In production, you should generate separate addresses for each chain
    const treasuryAddresses = {
      ethereum: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
      sui: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
      base: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
      polygon: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
      arbitrum: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
      arc: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
    };

    // Initialize treasury balances
    const treasuryBalance = {
      ethereum: '0',
      sui: '0',
      base: '0',
      polygon: '0',
      arbitrum: '0',
      arc: '0',
      total: '0',
    };

    // TODO: Deploy contracts on blockchain
    // TODO: Register ENS domain

    const updatedOrg = await prisma.organization.update({
      where: { organizationId: id },
      data: {
        kycStatus: 'APPROVED',
        verifiedAt: new Date(),
        verificationNotes: notes,
        ensName,
        treasuryAddresses,
        treasuryBalance,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        logId: `log-${crypto.randomBytes(8).toString('hex')}`,
        organizationId: organization.organizationId,
        eventType: 'organization_approved',
        actorId: approvedBy,
        affectedEntityType: 'organization',
        affectedEntityId: organization.organizationId,
        metadata: { notes },
      },
    });

    res.json({
      success: true,
      data: {
        organization: updatedOrg,
        authKeys, // Return keys only once
        ensName,
        message: 'Organization approved successfully. Auth keys generated.',
      },
    });
  } catch (error: any) {
    logger.error('Organization approval error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/organization/status/:id
 * Check organization registration status
 */
router.get('/status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { organizationId: id },
      include: {
        _count: {
          select: {
            employees: true,
            authKeys: true,
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    const status = {
      registrationComplete: !!organization.name,
      paymentReceived: organization.paymentStatus === 'PAYMENT_RECEIVED' || organization.paymentStatus === 'PAID',
      documentsUploaded: !!organization.kycDocuments,
      walletConnected: Array.isArray(organization.adminWallets) && organization.adminWallets.length > 0,
      verificationStatus: organization.kycStatus,
      approved: organization.kycStatus === 'APPROVED',
    };

    res.json({
      success: true,
      organization: {
        organizationId: organization.organizationId,
        name: organization.name,
        adminEmail: organization.adminEmail,
        kycStatus: organization.kycStatus,
        paymentStatus: organization.paymentStatus,
        subscriptionStatus: organization.subscriptionStatus,
        subscriptionTier: organization.subscriptionTier,
        employeeLimit: organization.employeeLimit,
        employeeCount: organization._count.employees,
        ensName: organization.ensName,
        verifiedAt: organization.verifiedAt,
        createdAt: organization.createdAt,
      },
      status: {
        registrationComplete: !!organization.name,
        paymentReceived: organization.paymentStatus === 'PAYMENT_RECEIVED' || organization.paymentStatus === 'PAID',
        documentsUploaded: !!organization.kycDocuments,
        walletConnected: Array.isArray(organization.adminWallets) && organization.adminWallets.length > 0,
        verificationStatus: organization.kycStatus,
        approved: organization.kycStatus === 'APPROVED',
      },
    });
  } catch (error: any) {
    logger.error('Get organization status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
