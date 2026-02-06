import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Payment configuration
const TREASURY_ADDRESS = '0xB18C4Be38412E8A12961a09988a9DD211257476F';
const REQUIRED_AMOUNT = '0.005'; // 0.005 ETH in Base Sepolia
const BASE_SEPOLIA_RPC = process.env.BASE_RPC_URL || 'https://sepolia.base.org';

/**
 * POST /api/payment/verify
 * Verify ETH payment and activate subscription
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { organizationId, txHash } = req.body;

    if (!organizationId || !txHash) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID and transaction hash are required',
      });
    }

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { organizationId },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    // Check if organization is already paid
    if (organization.paymentStatus === 'PAID' || organization.subscriptionStatus === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Organization subscription is already active',
      });
    }

    // Connect to Base Sepolia
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);

    try {
      // Get transaction receipt
      const tx = await provider.getTransaction(txHash);

      if (!tx) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found. Please wait a moment and try again.',
        });
      }

      // Verify transaction details
      const toAddress = tx.to?.toLowerCase();
      const treasuryAddress = TREASURY_ADDRESS.toLowerCase();

      if (toAddress !== treasuryAddress) {
        return res.status(400).json({
          success: false,
          error: `Invalid recipient address. Expected ${TREASURY_ADDRESS}`,
        });
      }

      // Verify amount
      const amountInEth = ethers.formatEther(tx.value);
      const requiredAmount = parseFloat(REQUIRED_AMOUNT);

      if (parseFloat(amountInEth) < requiredAmount) {
        return res.status(400).json({
          success: false,
          error: `Insufficient payment. Required: ${REQUIRED_AMOUNT} ETH, Received: ${amountInEth} ETH`,
        });
      }

      // Wait for confirmation
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not yet confirmed. Please wait and try again.',
        });
      }

      if (receipt.status === 0) {
        return res.status(400).json({
          success: false,
          error: 'Transaction failed on blockchain',
        });
      }

      // Payment verified! Activate subscription
      const updatedOrg = await prisma.organization.update({
        where: { organizationId },
        data: {
          paymentStatus: 'PAID',
          subscriptionStatus: 'ACTIVE',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          metadata: {
            ...(typeof organization.metadata === 'object' ? organization.metadata : {}),
            paymentTxHash: txHash,
            paidAmount: amountInEth,
            paidAt: new Date().toISOString(),
            paymentChain: 'base-sepolia',
          },
        },
      });

      logger.info(`Payment verified for organization ${organizationId}, tx: ${txHash}`);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          logId: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          eventType: 'subscription_activated',
          actorId: tx.from || 'unknown',
          affectedEntityType: 'organization',
          affectedEntityId: organizationId,
          metadata: {
            txHash,
            amount: amountInEth,
            chain: 'base-sepolia',
          },
        },
      });

      res.json({
        success: true,
        message: 'Payment verified and subscription activated successfully!',
        organization: {
          organizationId: updatedOrg.organizationId,
          name: updatedOrg.name,
          subscriptionStatus: updatedOrg.subscriptionStatus,
          paymentStatus: updatedOrg.paymentStatus,
          subscriptionTier: updatedOrg.subscriptionTier,
          nextBillingDate: updatedOrg.nextBillingDate,
        },
        transaction: {
          hash: txHash,
          amount: amountInEth,
          from: tx.from,
          to: tx.to,
          blockNumber: receipt.blockNumber,
        },
      });
    } catch (blockchainError: any) {
      logger.error('Blockchain verification error:', blockchainError);
      return res.status(500).json({
        success: false,
        error: 'Error verifying transaction on blockchain: ' + blockchainError.message,
      });
    }
  } catch (error: any) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/payment/status/:organizationId
 * Get payment status for an organization
 */
router.get('/status/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { organizationId },
      select: {
        organizationId: true,
        name: true,
        paymentStatus: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        nextBillingDate: true,
        monthlyPrice: true,
        annualPrice: true,
        billingCycle: true,
        metadata: true,
      },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    res.json({
      success: true,
      payment: {
        status: organization.paymentStatus,
        subscriptionStatus: organization.subscriptionStatus,
        subscriptionTier: organization.subscriptionTier,
        nextBillingDate: organization.nextBillingDate,
        pricing: {
          monthly: organization.monthlyPrice,
          annual: organization.annualPrice,
          billingCycle: organization.billingCycle,
        },
        paymentInfo: organization.metadata,
      },
    });
  } catch (error: any) {
    logger.error('Payment status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/payment/config
 * Get payment configuration (treasury address, required amount)
 */
router.get('/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    config: {
      treasuryAddress: TREASURY_ADDRESS,
      requiredAmount: REQUIRED_AMOUNT,
      currency: 'ETH',
      network: 'Base Sepolia',
      chainId: 84532,
    },
  });
});

export default router;
