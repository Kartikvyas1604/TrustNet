import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/organization/wallet-login
 * Login organization using wallet address
 */
router.post('/organization/wallet-login', async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }

    // Find organization by admin wallet - search through all organizations
    const organizations = await prisma.organization.findMany();
    
    const organization = organizations.find(org => {
      const adminWallets = org.adminWallets as any;
      if (Array.isArray(adminWallets)) {
        return adminWallets.some((wallet: any) => 
          wallet.address?.toLowerCase() === walletAddress.toLowerCase()
        );
      }
      return false;
    });

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        error: 'No organization found for this wallet address' 
      });
    }

    // Check if organization is approved
    if (organization.kycStatus !== 'APPROVED') {
      return res.json({
        success: true,
        status: 'pending_approval',
        organizationId: organization.organizationId,
        message: 'Organization registration is pending admin approval',
      });
    }

    // Create session
    res.json({
      success: true,
      organizationId: organization.organizationId,
      name: organization.name,
      status: 'active',
      message: 'Login successful',
    });
  } catch (error: any) {
    logger.error('Organization wallet login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/employee/wallet-login
 * Login employee using wallet address
 */
router.post('/employee/wallet-login', async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }

    // Find employee by wallet address
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { walletAddresses: { path: ['ethereum'], equals: walletAddress } },
          { walletAddresses: { path: ['base'], equals: walletAddress } },
          { walletAddresses: { path: ['sui'], equals: walletAddress } },
        ],
        status: 'ACTIVE',
      },
      include: {
        organization: {
          select: {
            organizationId: true,
            name: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'No employee found for this wallet address. Please complete onboarding first.' 
      });
    }

    // Create session
    res.json({
      success: true,
      employeeId: employee.employeeId,
      nickname: (employee.profileData as any)?.nickname || 'Employee',
      organizationId: employee.organization.organizationId,
      organizationName: employee.organization.name,
      status: 'active',
      message: 'Login successful',
    });
  } catch (error: any) {
    logger.error('Employee wallet login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
