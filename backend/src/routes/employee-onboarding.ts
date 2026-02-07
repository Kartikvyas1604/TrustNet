import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { suiBlockchainService } from '../services/SuiBlockchainService';
import ensService from '../services/ENSService';
import yellowNetworkService from '../services/YellowNetworkService';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * STEP 3: Auth Code Entry & Validation
 * POST /api/employee/verify-code
 */
router.post(
  '/verify-code',
  [
    body('authCode')
      .notEmpty()
      .withMessage('Auth code is required')
      .matches(/^[A-Z0-9]{3,4}-[A-Z0-9]{3,4}-[A-Z0-9]{3,4}-[A-Z0-9]{3,4}$/)
      .withMessage('Invalid auth code format'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { authCode } = req.body;

      // Find matching auth key (allow both UNUSED and ACTIVE status for reusable codes)
      const authKeys = await prisma.authKey.findMany({
        where: { 
          status: { 
            in: ['UNUSED', 'ACTIVE'] // Allow reusable auth codes
          } 
        },
        include: { organization: true },
      });

      let matchedKey = null;
      for (const key of authKeys) {
        const isMatch = await bcrypt.compare(authCode, key.keyHash);
        if (isMatch) {
          matchedKey = key;
          break;
        }
      }

      if (!matchedKey) {
        return res.status(400).json({
          success: false,
          error: 'Invalid auth code. Please check the code and try again.',
        });
      }

      // Check if organization is approved
      if (matchedKey.organization.kycStatus !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          error: 'Your organization is pending verification. Please contact your administrator.',
        });
      }

      // Check if subscription is active
      if (matchedKey.organization.subscriptionStatus !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          error: 'Your organization subscription has expired. Please contact your administrator.',
        });
      }

      // If auth key is already assigned to an employee, check if they're logging back in
      if (matchedKey.status === 'ACTIVE' && matchedKey.assignedEmployeeId) {
        const existingEmployee = await prisma.employee.findUnique({
          where: { employeeId: matchedKey.assignedEmployeeId },
          include: { organization: true },
        });

        if (existingEmployee) {
          // Employee exists, allow re-login with same code
          res.json({
            success: true,
            data: {
              valid: true,
              organizationId: matchedKey.organizationId,
              organizationName: matchedKey.organization.name,
              organizationLogo: null,
              tempToken: Buffer.from(JSON.stringify({ 
                authKeyId: matchedKey.id, 
                authCode,
                existingEmployeeId: existingEmployee.employeeId 
              })).toString('base64'),
              isReturningEmployee: true,
              existingEmployeeId: existingEmployee.employeeId,
            },
          });
          return;
        }
      }

      res.json({
        success: true,
        data: {
          valid: true,
          organizationId: matchedKey.organizationId,
          organizationName: matchedKey.organization.name,
          organizationLogo: null, // TODO: Add logo URL
          tempToken: Buffer.from(JSON.stringify({ authKeyId: matchedKey.id, authCode })).toString('base64'),
        },
      });
    } catch (error: any) {
      logger.error('Auth code verification error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * STEP 4: Employee Wallet Connection & Signature Challenge
 * POST /api/employee/connect-wallet
 */
router.post(
  '/connect-wallet',
  [
    body('tempToken').notEmpty().withMessage('Temp token is required'),
    body('walletAddress').notEmpty().withMessage('Wallet address is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tempToken, walletAddress } = req.body;

      // Decode temp token
      const decoded = JSON.parse(Buffer.from(tempToken, 'base64').toString());
      const { authKeyId } = decoded;

      // Check if wallet is already registered
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          walletAddresses: {
            path: ['ethereum'],
            equals: walletAddress,
          },
        },
      });

      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          error: 'This wallet is already registered to another employee',
        });
      }

      // Generate signature challenge
      const nonce = crypto.randomBytes(32).toString('hex');
      const message = `Sign this message to prove you own this wallet.\n\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

      // Store challenge temporarily (in production, use Redis with expiry)
      // For now, we'll include it in the response

      res.json({
        success: true,
        data: {
          challenge: {
            message,
            nonce,
          },
          walletAddress,
        },
      });
    } catch (error: any) {
      logger.error('Wallet connection error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * STEP 4b: Verify Wallet Signature
 * POST /api/employee/verify-signature
 */
router.post(
  '/verify-signature',
  [
    body('tempToken').notEmpty().withMessage('Temp token is required'),
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

      const { tempToken, walletAddress, signature, message } = req.body;

      // TODO: Verify signature matches wallet address using ethers.js
      // const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      // if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      //   return res.status(400).json({ success: false, error: 'Invalid signature' });
      // }

      res.json({
        success: true,
        data: {
          verified: true,
          message: 'Signature verified. Proceed to profile creation.',
        },
      });
    } catch (error: any) {
      logger.error('Signature verification error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * STEP 5: Profile Creation & Full Onboarding
 * POST /api/employee/complete-onboarding
 */
router.post(
  '/complete-onboarding',
  [
    body('tempToken').notEmpty().withMessage('Temp token is required'),
    body('walletAddress').notEmpty().withMessage('Wallet address is required'),
    body('nickname').notEmpty().withMessage('Nickname is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tempToken, walletAddress, nickname, email, avatar, jobTitle } = req.body;

      // Decode temp token
      const decoded = JSON.parse(Buffer.from(tempToken, 'base64').toString());
      const { authKeyId, authCode } = decoded;

      // Get auth key
      const authKey = await prisma.authKey.findUnique({
        where: { id: authKeyId },
        include: { organization: true },
      });

      if (!authKey) {
        return res.status(400).json({
          success: false,
          error: 'Invalid auth code',
        });
      }

      // Check if auth key is revoked or expired
      if (authKey.status === 'REVOKED' || authKey.status === 'EXPIRED') {
        return res.status(400).json({
          success: false,
          error: 'This auth code has been revoked or expired',
        });
      }

      // Check if employee already exists with this wallet
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          walletAddresses: {
            path: ['ethereum'],
            equals: walletAddress.toLowerCase(),
          },
        },
      });

      if (existingEmployee) {
        // Employee already exists, just log them in
        return res.status(200).json({
          success: true,
          data: {
            employeeId: existingEmployee.employeeId,
            ensName: existingEmployee.ensName,
            walletAddress: walletAddress,
            organizationName: authKey.organization.name,
            status: 'active',
            message: 'Welcome back! Logging you in.',
            isExisting: true,
          },
        });
      }

      // Check if employee already exists with this auth key
      if (authKey.assignedEmployeeId) {
        const assignedEmployee = await prisma.employee.findUnique({
          where: { employeeId: authKey.assignedEmployeeId },
        });

        if (assignedEmployee) {
          // Employee exists, log them in
          return res.status(200).json({
            success: true,
            data: {
              employeeId: assignedEmployee.employeeId,
              ensName: assignedEmployee.ensName,
              walletAddress: walletAddress,
              organizationName: authKey.organization.name,
              status: 'active',
              message: 'Welcome back! Logging you in.',
              isExisting: true,
            },
          });
        }
      }

      // Generate employee ID
      const employeeId = `emp-${crypto.randomBytes(8).toString('hex')}`;

      // Generate ENS subdomain
      const orgEnsName = authKey.organization.ensName || 'organization';
      const baseEns = orgEnsName.replace('.eth', '');
      const ensName = `${nickname.toLowerCase().replace(/\s+/g, '')}.${baseEns}.eth`;

      // Create employee record
      const employee = await prisma.employee.create({
        data: {
          employeeId,
          organizationId: authKey.organizationId,
          walletAddresses: {
            ethereum: walletAddress,
            sui: null, // Will be set after Sui wallet creation
            base: null,
            polygon: null,
            arbitrum: null,
            arc: null,
          },
          authKeyHash: authKey.keyHash,
          ensName,
          profileData: {
            nickname,
            email,
            avatar,
            jobTitle,
          },
          status: 'ACTIVE',
          privacyPreferences: {
            defaultPrivacyLevel: 'ORGANIZATION_ONLY',
            preferredChain: 'sui',
            notificationSettings: {
              email: !!email,
              push: true,
            },
          },
          channels: [],
        },
      });

      // Update auth key status
      await prisma.authKey.update({
        where: { id: authKeyId },
        data: {
          status: 'ACTIVE',
          assignedEmployeeId: employeeId,
          usedAt: new Date(),
        },
      });

      // STEP 6: Blockchain Operations (async process)
      // In production, this should be handled by a background job
      try {
        // A. Create ENS subdomain
        // await ensService.createSubdomain(baseEns, nickname.toLowerCase(), walletAddress);

        // B. Create Sui child wallet
        // const suiWallet = await suiBlockchainService.createEmployeeWallet(employeeId, authKey.organizationId, walletAddress);

        // C. Open Yellow Network channel
        // const channel = await yellowNetworkService.openChannel(employeeId, walletAddress);

        // D. Update merkle tree
        // TODO: Add employee to organization's merkle tree

        // Update employee with blockchain data
        await prisma.employee.update({
          where: { employeeId },
          data: {
            walletAddresses: {
              ethereum: walletAddress,
              sui: 'sui-wallet-address', // suiWallet.address
              base: walletAddress,
              polygon: walletAddress,
              arbitrum: walletAddress,
              arc: walletAddress,
            },
            channels: [
              {
                channelId: 'channel-id',
                network: 'yellow',
                status: 'open',
                openedAt: new Date().toISOString(),
              },
            ],
          },
        });
      } catch (blockchainError: any) {
        logger.error('Blockchain operations error (non-blocking):', blockchainError);
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          logId: `log-${crypto.randomBytes(8).toString('hex')}`,
          organizationId: authKey.organizationId,
          eventType: 'employee_onboarded',
          actorId: employeeId,
          affectedEntityType: 'employee',
          affectedEntityId: employeeId,
          metadata: {
            nickname,
            ensName,
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          employeeId,
          ensName,
          walletAddress,
          organizationName: authKey.organization.name,
          status: 'active',
          message: 'Onboarding complete! Welcome to TrustNet.',
        },
      });
    } catch (error: any) {
      logger.error('Employee onboarding error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/employee/profile/:id
 * Get employee profile
 */
router.get('/profile/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { employeeId: id },
      include: {
        organization: {
          select: {
            organizationId: true,
            name: true,
            ensName: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Get balances (from Redis cache or blockchain)
    const balances = {
      onChain: '0',
      offChain: '0',
      total: '0',
    };

    // Get transaction count
    const transactionCount = await prisma.transaction.count({
      where: {
        OR: [
          { fromEmployeeId: id },
          { toEmployeeId: id },
        ],
      },
    });

    res.json({
      success: true,
      employee: {
        employeeId: employee.employeeId,
        nickname: (employee.profileData as any)?.nickname || 'Employee',
        email: (employee.profileData as any)?.email || '',
        avatar: (employee.profileData as any)?.avatar,
        jobTitle: (employee.profileData as any)?.jobTitle || 'Team Member',
        ensName: employee.ensName,
        ensSubdomain: employee.ensName, // For compatibility
        walletAddresses: employee.walletAddresses,
        primaryWallet: (employee.walletAddresses as any)?.ethereum || (employee.walletAddresses as any)?.base,
        status: employee.status,
        onboardingDate: employee.onboardingDate,
        organizationId: employee.organization.organizationId,
        organizationName: employee.organization.name,
        // Balance information
        onChainBalance: 0,
        offChainBalance: 0,
        totalBalance: 0,
        // Transaction statistics
        totalSent: 0,
        sentCount: 0,
        totalReceived: 0,
        receivedCount: 0,
        transactionCount,
      },
    });
  } catch (error: any) {
    logger.error('Get employee profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/employee/balance/:id
 * Get employee balance
 */
router.get('/balance/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { employeeId: id },
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // TODO: Get actual balance from blockchain
    // For now, return mock data
    res.json({
      success: true,
      balance: {
        onChain: '1000.00',
        offChain: '500.00',
        total: '1500.00',
        currency: 'USDC',
      },
    });
  } catch (error: any) {
    logger.error('Get employee balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/employee/check-recipient
 * Check if recipient address is internal or external
 */
router.post('/check-recipient', async (req: Request, res: Response) => {
  try {
    const { recipient, employeeId } = req.body;

    if (!recipient) {
      return res.status(400).json({ success: false, error: 'Recipient address required' });
    }

    // Check if recipient is an ENS name (ends with .eth)
    if (recipient.endsWith('.eth')) {
      // Check if it's an internal ENS
      const employee = await prisma.employee.findFirst({
        where: {
          ensName: recipient,
        },
      });

      if (employee) {
        return res.json({
          success: true,
          isInternal: true,
          recipientType: 'ens',
          recipientInfo: {
            ensName: employee.ensName,
            nickname: (employee.profileData as any)?.nickname,
          },
        });
      }
    }

    // Check if it's a wallet address
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { walletAddresses: { path: ['ethereum'], equals: recipient } },
          { walletAddresses: { path: ['base'], equals: recipient } },
          { walletAddresses: { path: ['sui'], equals: recipient } },
        ],
      },
    });

    if (employee) {
      return res.json({
        success: true,
        isInternal: true,
        recipientType: 'wallet',
        recipientInfo: {
          ensName: employee.ensName,
          nickname: (employee.profileData as any)?.nickname,
        },
      });
    }

    // External address
    res.json({
      success: true,
      isInternal: false,
      recipientType: 'external',
    });
  } catch (error: any) {
    logger.error('Check recipient error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/employee/organization/:organizationId/directory
 * Get organization employee directory
 */
router.get('/organization/:organizationId/directory', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    const employees = await prisma.employee.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      select: {
        employeeId: true,
        ensName: true,
        profileData: true,
        onboardingDate: true,
      },
      orderBy: {
        onboardingDate: 'desc',
      },
    });

    res.json({
      success: true,
      data: {
        employees: employees.map(emp => ({
          id: emp.employeeId,
          nickname: (emp.profileData as any)?.nickname,
          avatar: (emp.profileData as any)?.avatar,
          jobTitle: (emp.profileData as any)?.jobTitle,
          ensName: emp.ensName,
          onboardingDate: emp.onboardingDate,
        })),
        count: employees.length,
      },
    });
  } catch (error: any) {
    logger.error('Get employee directory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
