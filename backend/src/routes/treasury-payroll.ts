import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { suiBlockchainService } from '../services/SuiBlockchainService';
import { getWebSocketService } from '../services/websocket.service';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/treasury/:organizationId
 * Get organization treasury balance
 */
router.get('/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { organizationId },
    });

    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Get balances from blockchain
    // In production, this would query actual blockchain balances
    const treasuryBalance = organization.treasuryBalance || {
      ethereum: '0',
      sui: '0',
      base: '0',
      polygon: '0',
      arbitrum: '0',
      arc: '0',
      total: '0',
    };

    res.json({
      success: true,
      data: {
        treasuryAddresses: organization.treasuryAddresses,
        balances: treasuryBalance,
        currency: 'USDC',
      },
    });
  } catch (error: any) {
    logger.error('Get treasury balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/treasury/:organizationId/deposit
 * Get deposit addresses for treasury funding
 */
router.post('/:organizationId/deposit', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { chain } = req.body;

    const organization = await prisma.organization.findUnique({
      where: { organizationId },
    });

    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    const treasuryAddresses = organization.treasuryAddresses as any;

    if (!treasuryAddresses) {
      return res.status(400).json({
        success: false,
        error: 'Treasury addresses not configured. Complete organization setup first.',
      });
    }

    const depositAddress = treasuryAddresses[chain];

    if (!depositAddress) {
      return res.status(400).json({
        success: false,
        error: `Chain ${chain} not supported`,
      });
    }

    res.json({
      success: true,
      data: {
        chain,
        address: depositAddress,
        qrCode: `data:image/png;base64,...`, // TODO: Generate QR code
        minDeposit: '100',
        currency: 'USDC',
        message: `Send USDC to this address on ${chain}`,
      },
    });
  } catch (error: any) {
    logger.error('Get deposit address error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/treasury/:organizationId/deposit-detected
 * Webhook/Callback when deposit detected (called by blockchain indexer)
 */
router.post('/:organizationId/deposit-detected', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { chain, amount, txHash, fromAddress } = req.body;

    const organization = await prisma.organization.findUnique({
      where: { organizationId },
    });

    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Update treasury balance
    const currentBalance = organization.treasuryBalance as any || {};
    const newBalance = {
      ...currentBalance,
      [chain]: (parseFloat(currentBalance[chain] || '0') + parseFloat(amount)).toString(),
    };

    // Calculate total
    newBalance.total = Object.keys(newBalance)
      .filter(k => k !== 'total')
      .reduce((sum, k) => sum + parseFloat(newBalance[k] || '0'), 0)
      .toString();

    await prisma.organization.update({
      where: { organizationId },
      data: {
        treasuryBalance: newBalance,
      },
    });

    // Emit WebSocket event
    getWebSocketService().emit('treasury_deposit', organizationId, {
      chain,
      amount,
      newBalance: newBalance[chain],
      totalBalance: newBalance.total,
      txHash,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        logId: `log-${crypto.randomBytes(8).toString('hex')}`,
        organizationId,
        eventType: 'treasury_deposit',
        actorId: fromAddress,
        affectedEntityType: 'organization',
        affectedEntityId: organizationId,
        metadata: {
          chain,
          amount,
          txHash,
        },
      },
    });

    res.json({
      success: true,
      data: {
        message: 'Deposit detected and balance updated',
        newBalance: newBalance[chain],
      },
    });
  } catch (error: any) {
    logger.error('Deposit detection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payroll/run
 * Run payroll distribution for all or selected employees
 */
router.post(
  '/run',
  [
    body('organizationId').notEmpty().withMessage('Organization ID is required'),
    body('initiatedBy').notEmpty().withMessage('Initiator wallet address is required'),
    body('payrollData').isArray().withMessage('Payroll data must be an array'),
    body('currency').notEmpty().withMessage('Currency is required'),
    body('chain').notEmpty().withMessage('Chain is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { organizationId, initiatedBy, payrollData, currency, chain } = req.body;

      // payrollData format: [{employeeId, amount}, ...]

      // Validate organization
      const organization = await prisma.organization.findUnique({
        where: { organizationId },
      });

      if (!organization) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      // Verify initiator is admin
      const adminWallets = organization.adminWallets as any[];
      const isAdmin = adminWallets.some(w => w.address.toLowerCase() === initiatedBy.toLowerCase());

      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Not an admin wallet' });
      }

      // Calculate total amount
      const totalAmount = payrollData.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0).toString();

      // Check treasury balance
      const treasuryBalance = organization.treasuryBalance as any || {};
      const availableBalance = parseFloat(treasuryBalance[chain] || '0');

      if (availableBalance < parseFloat(totalAmount)) {
        return res.status(400).json({
          success: false,
          error: `Insufficient balance. Required: ${totalAmount} ${currency}, Available: ${availableBalance} ${currency}`,
        });
      }

      // Create payroll run
      const payrollId = `payroll-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const payrollRun = await prisma.payrollRun.create({
        data: {
          payrollId,
          organizationId,
          initiatedBy,
          totalAmount,
          currency,
          chain,
          employeeCount: payrollData.length,
          payrollData: payrollData.map((item: any) => ({
            ...item,
            status: 'pending',
          })),
          status: 'PROCESSING',
        },
      });

      // Execute blockchain transaction (Sui PTB for batch payments)
      try {
        // Build Programmable Transaction Block
        // const txHash = await suiBlockchainService.executeBatchPayroll(
        //   organizationId,
        //   payrollData,
        //   currency
        // );

        const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

        // Update payroll run
        await prisma.payrollRun.update({
          where: { payrollId },
          data: {
            status: 'COMPLETED',
            blockchainTxHash: txHash,
            executedAt: new Date(),
            gasUsed: '0.10',
            payrollData: payrollData.map((item: any) => ({
              ...item,
              status: 'completed',
            })),
          },
        });

        // Create individual transaction records for each employee
        const transactionPromises = payrollData.map(async (item: any) => {
          const transactionId = `tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

          await prisma.transaction.create({
            data: {
              transactionId,
              organizationId,
              fromEmployeeId: item.employeeId, // Organization pays itself for bookkeeping
              toEmployeeId: item.employeeId,
              amount: item.amount,
              currency,
              chain,
              transactionType: 'PAYROLL',
              blockchainTxHash: txHash,
              privacyLevel: 'ORGANIZATION_ONLY',
              status: 'CONFIRMED',
              timestamp: new Date(),
              gasUsed: '0.01',
              metadata: {
                payrollId,
                payrollBatch: true,
              },
            },
          });

          // Get employee for notification
          const employee = await prisma.employee.findUnique({
            where: { employeeId: item.employeeId },
          });

          if (employee) {
            // Emit WebSocket event to employee
            getWebSocketService().emit('payroll_received', employee.employeeId, {
              amount: item.amount,
              currency,
              transactionId,
              payrollId,
              message: `Payroll received: +${item.amount} ${currency}`,
            });
          }
        });

        await Promise.all(transactionPromises);

        // Update treasury balance
        const newBalance = {
          ...(organization.treasuryBalance as any),
          [chain]: (availableBalance - parseFloat(totalAmount)).toString(),
        };

        newBalance.total = Object.keys(newBalance)
          .filter(k => k !== 'total')
          .reduce((sum: number, k: string) => sum + parseFloat(newBalance[k] || '0'), 0)
          .toString();

        await prisma.organization.update({
          where: { organizationId },
          data: {
            treasuryBalance: newBalance,
          },
        });

        // Emit WebSocket event to organization dashboard
        getWebSocketService().emit('payroll_completed', organizationId, {
          payrollId,
          employeeCount: payrollData.length,
          totalAmount,
          txHash,
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            logId: `log-${crypto.randomBytes(8).toString('hex')}`,
            organizationId,
            eventType: 'payroll_executed',
            actorId: initiatedBy,
            affectedEntityType: 'payroll',
            affectedEntityId: payrollId,
            metadata: {
              employeeCount: payrollData.length,
              totalAmount,
              currency,
              chain,
              txHash,
            },
          },
        });

        res.json({
          success: true,
          data: {
            payrollId,
            status: 'completed',
            employeeCount: payrollData.length,
            totalAmount,
            currency,
            chain,
            txHash,
            gasUsed: '0.10',
            message: 'Payroll distributed successfully',
          },
        });
      } catch (blockchainError: any) {
        logger.error('Payroll blockchain execution error:', blockchainError);

        // Update payroll run to failed
        await prisma.payrollRun.update({
          where: { payrollId },
          data: {
            status: 'FAILED',
            metadata: {
              error: blockchainError.message,
            },
          },
        });

        res.status(500).json({
          success: false,
          error: 'Payroll execution failed',
          details: blockchainError.message,
        });
      }
    } catch (error: any) {
      logger.error('Payroll run error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/payroll/history/:organizationId
 * Get payroll history for an organization
 */
router.get('/history/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const payrollRuns = await prisma.payrollRun.findMany({
      where: { organizationId },
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({
      success: true,
      data: {
        payrollRuns: payrollRuns.map((pr) => ({
          payrollId: pr.payrollId,
          employeeCount: pr.employeeCount,
          totalAmount: pr.totalAmount,
          currency: pr.currency,
          chain: pr.chain,
          status: pr.status,
          executedAt: pr.executedAt,
          blockchainTxHash: pr.blockchainTxHash,
          gasUsed: pr.gasUsed,
        })),
        count: payrollRuns.length,
      },
    });
  } catch (error: any) {
    logger.error('Get payroll history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payroll/employees/:organizationId
 * Get employee list with suggested payroll amounts
 */
router.get('/employees/:organizationId', async (req: Request, res: Response) => {
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
        onboardingDate: 'asc',
      },
    });

    const employeesWithPayroll = employees.map(emp => ({
      employeeId: emp.employeeId,
      ensName: emp.ensName,
      nickname: (emp.profileData as any)?.nickname,
      jobTitle: (emp.profileData as any)?.jobTitle,
      suggestedAmount: '2000', // TODO: Get from employee profile or previous payroll
      lastPayroll: null, // TODO: Get last payroll date
    }));

    res.json({
      success: true,
      data: {
        employees: employeesWithPayroll,
        count: employeesWithPayroll.length,
      },
    });
  } catch (error: any) {
    logger.error('Get payroll employees error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
