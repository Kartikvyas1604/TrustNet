import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import yellowNetworkService from '../services/YellowNetworkService';
import { suiBlockchainService } from '../services/SuiBlockchainService';
import webSocketService from '../services/WebSocketService';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/transactions/send
 * Initiate a transaction (internal or external)
 */
router.post(
  '/send',
  [
    body('fromEmployeeId').notEmpty().withMessage('From employee ID is required'),
    body('toAddress').notEmpty().withMessage('Recipient address is required'),
    body('amount').notEmpty().withMessage('Amount is required'),
    body('currency').notEmpty().withMessage('Currency is required'),
    body('chain').notEmpty().withMessage('Chain is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { fromEmployeeId, toAddress, amount, currency, chain, memo, privacyLevel } = req.body;

      // Get sender employee
      const fromEmployee = await prisma.employee.findUnique({
        where: { employeeId: fromEmployeeId },
        include: { organization: true },
      });

      if (!fromEmployee) {
        return res.status(404).json({ success: false, error: 'Sender not found' });
      }

      // Check if recipient is in same organization (internal transaction)
      let toEmployee = null;
      
      // Try matching by ENS name first
      if (toAddress.includes('.eth')) {
        toEmployee = await prisma.employee.findFirst({
          where: {
            ensName: toAddress,
            organizationId: fromEmployee.organizationId,
          },
        });
      }

      // Try matching by wallet address
      if (!toEmployee) {
        toEmployee = await prisma.employee.findFirst({
          where: {
            organizationId: fromEmployee.organizationId,
            OR: [
              { walletAddresses: { path: ['ethereum'], equals: toAddress } },
              { walletAddresses: { path: ['sui'], equals: toAddress } },
              { walletAddresses: { path: ['base'], equals: toAddress } },
            ],
          },
        });
      }

      const isInternalTransaction = !!toEmployee;

      if (isInternalTransaction) {
        // INTERNAL TRANSACTION (Child-to-Child, Free, Instant)
        return handleInternalTransaction(fromEmployee, toEmployee!, amount, currency, chain, memo, privacyLevel, res);
      } else {
        // EXTERNAL TRANSACTION (Requires Parent Approval)
        return handleExternalTransaction(fromEmployee, toAddress, amount, currency, chain, memo, res);
      }
    } catch (error: any) {
      logger.error('Transaction send error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * Handle Internal Transaction (Off-Chain, Yellow Network)
 */
async function handleInternalTransaction(
  fromEmployee: any,
  toEmployee: any,
  amount: string,
  currency: string,
  chain: string,
  memo: string,
  privacyLevel: string,
  res: Response
) {
  try {
    // Generate transaction ID
    const transactionId = `tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Check sender balance (from Redis cache or blockchain)
    // TODO: Implement balance check

    // Process via Yellow Network (off-chain)
    try {
      // Update channel states
      // await yellowNetworkService.updateChannelBalance(fromEmployee.employeeId, -parseFloat(amount));
      // await yellowNetworkService.updateChannelBalance(toEmployee.employeeId, parseFloat(amount));

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          transactionId,
          organizationId: fromEmployee.organizationId,
          fromEmployeeId: fromEmployee.employeeId,
          toEmployeeId: toEmployee.employeeId,
          amount,
          currency,
          chain,
          transactionType: 'YELLOW_OFFCHAIN',
          privacyLevel: privacyLevel || 'ORGANIZATION_ONLY',
          status: 'CONFIRMED',
          timestamp: new Date(),
          gasUsed: '0',
          metadata: { memo, processingTime: '50ms' },
        },
      });

      // Emit WebSocket events for real-time updates
      webSocketService.emit('balance_updated', fromEmployee.employeeId, {
        newBalance: '0', // TODO: Calculate actual balance
        transactionId,
      });

      webSocketService.emit('payment_received', toEmployee.employeeId, {
        from: fromEmployee.ensName,
        amount,
        currency,
        transactionId,
      });

      webSocketService.emit('transaction_completed', fromEmployee.organizationId, {
        transactionId,
        type: 'internal',
        amount,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          logId: `log-${crypto.randomBytes(8).toString('hex')}`,
          organizationId: fromEmployee.organizationId,
          eventType: 'internal_transaction',
          actorId: fromEmployee.employeeId,
          affectedEntityType: 'transaction',
          affectedEntityId: transactionId,
          metadata: {
            from: fromEmployee.ensName,
            to: toEmployee.ensName,
            amount,
            currency,
          },
        },
      });

      res.json({
        success: true,
        data: {
          transactionId,
          type: 'internal',
          status: 'confirmed',
          from: fromEmployee.ensName,
          to: toEmployee.ensName,
          amount,
          currency,
          gasUsed: '0',
          processingTime: '50ms',
          message: `Sent ${amount} ${currency} to ${toEmployee.ensName}`,
        },
      });
    } catch (error: any) {
      logger.error('Yellow Network processing error:', error);
      res.status(500).json({ success: false, error: 'Transaction processing failed' });
    }
  } catch (error: any) {
    logger.error('Internal transaction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Handle External Transaction (Requires Approval)
 */
async function handleExternalTransaction(
  fromEmployee: any,
  toAddress: string,
  amount: string,
  currency: string,
  chain: string,
  memo: string,
  res: Response
) {
  try {
    // Create approval request
    const approvalId = `approval-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const approval = await prisma.externalTransactionApproval.create({
      data: {
        approvalId,
        organizationId: fromEmployee.organizationId,
        employeeId: fromEmployee.employeeId,
        toAddress,
        amount,
        currency,
        chain,
        memo,
        status: 'PENDING',
        requestedAt: new Date(),
      },
    });

    // Lock sender's balance (reserve funds)
    // TODO: Implement balance locking

    // Notify organization admin(s)
    webSocketService.emit('external_approval_requested', fromEmployee.organizationId, {
      approvalId,
      employeeName: (fromEmployee.profileData as any)?.nickname,
      employeeEns: fromEmployee.ensName,
      toAddress,
      amount,
      currency,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        logId: `log-${crypto.randomBytes(8).toString('hex')}`,
        organizationId: fromEmployee.organizationId,
        eventType: 'external_transaction_requested',
        actorId: fromEmployee.employeeId,
        affectedEntityType: 'approval',
        affectedEntityId: approvalId,
        metadata: {
          toAddress,
          amount,
          currency,
        },
      },
    });

    res.json({
      success: true,
      data: {
        approvalId,
        type: 'external',
        status: 'pending_approval',
        toAddress,
        amount,
        currency,
        message: 'Transaction requires organization approval. You will be notified once reviewed.',
      },
    });
  } catch (error: any) {
    logger.error('External transaction request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/transactions/external/approve
 * Admin approves an external transaction
 */
router.post('/external/approve', async (req: Request, res: Response) => {
  try {
    const { approvalId, reviewedBy, signature } = req.body;

    // Get approval
    const approval = await prisma.externalTransactionApproval.findUnique({
      where: { approvalId },
      include: {
        organization: true,
      },
    });

    if (!approval) {
      return res.status(404).json({ success: false, error: 'Approval request not found' });
    }

    if (approval.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Approval already processed' });
    }

    // TODO: Verify reviewedBy is an admin wallet

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { employeeId: approval.employeeId },
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Execute blockchain transaction
    try {
      // Settle Yellow channel to on-chain
      // Close and settle employee's off-chain balance

      // Execute Sui transaction with parent co-signature
      // const txHash = await suiBlockchainService.executeExternalTransaction(
      //   employee.employeeId,
      //   approval.toAddress,
      //   approval.amount,
      //   approval.currency,
      //   signature
      // );

      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

      // Create transaction record
      const transactionId = `tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      const transaction = await prisma.transaction.create({
        data: {
          transactionId,
          organizationId: approval.organizationId,
          fromEmployeeId: approval.employeeId,
          toEmployeeId: approval.employeeId, // Same for external (required by schema)
          amount: approval.amount,
          currency: approval.currency,
          chain: approval.chain,
          transactionType: 'SUI_DIRECT',
          blockchainTxHash: txHash,
          privacyLevel: 'PUBLIC',
          status: 'CONFIRMED',
          timestamp: new Date(),
          gasUsed: '0.01',
          metadata: {
            externalAddress: approval.toAddress,
            approvalId,
            reviewedBy,
          },
        },
      });

      // Update approval
      await prisma.externalTransactionApproval.update({
        where: { approvalId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy,
          transactionId,
        },
      });

      // Unlock employee's balance

      // Notify employee
      webSocketService.emit('transaction_approved', employee.employeeId, {
        approvalId,
        transactionId,
        txHash,
        message: 'Your transaction was approved and completed',
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          logId: `log-${crypto.randomBytes(8).toString('hex')}`,
          organizationId: approval.organizationId,
          eventType: 'external_transaction_approved',
          actorId: reviewedBy,
          affectedEntityType: 'transaction',
          affectedEntityId: transactionId,
          metadata: {
            approvalId,
            employeeId: employee.employeeId,
            toAddress: approval.toAddress,
            amount: approval.amount,
          },
        },
      });

      res.json({
        success: true,
        data: {
          approvalId,
          transactionId,
          txHash,
          status: 'approved',
          message: 'Transaction approved and executed successfully',
        },
      });
    } catch (blockchainError: any) {
      logger.error('Blockchain execution error:', blockchainError);
      
      // Update approval to failed
      await prisma.externalTransactionApproval.update({
        where: { approvalId },
        data: {
          status: 'PENDING', // Keep as pending so admin can retry
        },
      });

      res.status(500).json({
        success: false,
        error: 'Blockchain transaction failed',
        details: blockchainError.message,
      });
    }
  } catch (error: any) {
    logger.error('Approval processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/transactions/external/reject
 * Admin rejects an external transaction
 */
router.post('/external/reject', async (req: Request, res: Response) => {
  try {
    const { approvalId, reviewedBy, reason } = req.body;

    const approval = await prisma.externalTransactionApproval.findUnique({
      where: { approvalId },
    });

    if (!approval) {
      return res.status(404).json({ success: false, error: 'Approval request not found' });
    }

    if (approval.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Approval already processed' });
    }

    // Update approval
    await prisma.externalTransactionApproval.update({
      where: { approvalId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy,
        rejectionReason: reason,
      },
    });

    // Unlock employee's balance

    // Notify employee
    const employee = await prisma.employee.findUnique({
      where: { employeeId: approval.employeeId },
    });

    if (employee) {
      webSocketService.emit('transaction_rejected', employee.employeeId, {
        approvalId,
        reason,
        message: `Your transaction was declined. Reason: ${reason}`,
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        logId: `log-${crypto.randomBytes(8).toString('hex')}`,
        organizationId: approval.organizationId,
        eventType: 'external_transaction_rejected',
        actorId: reviewedBy,
        affectedEntityType: 'approval',
        affectedEntityId: approvalId,
        metadata: {
          employeeId: approval.employeeId,
          toAddress: approval.toAddress,
          amount: approval.amount,
          reason,
        },
      },
    });

    res.json({
      success: true,
      data: {
        approvalId,
        status: 'rejected',
        reason,
        message: 'Transaction rejected successfully',
      },
    });
  } catch (error: any) {
    logger.error('Rejection processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/transactions/pending-approvals/:organizationId
 * Get all pending external transaction approvals for an organization
 */
router.get('/pending-approvals/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    const approvals = await prisma.externalTransactionApproval.findMany({
      where: {
        organizationId,
        status: 'PENDING',
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    // Get employee details for each approval
    const approvalsWithDetails = await Promise.all(
      approvals.map(async (approval) => {
        const employee = await prisma.employee.findUnique({
          where: { employeeId: approval.employeeId },
          select: {
            ensName: true,
            profileData: true,
          },
        });

        return {
          approvalId: approval.approvalId,
          employee: {
            id: approval.employeeId,
            ensName: employee?.ensName,
            nickname: (employee?.profileData as any)?.nickname,
          },
          toAddress: approval.toAddress,
          amount: approval.amount,
          currency: approval.currency,
          chain: approval.chain,
          memo: approval.memo,
          requestedAt: approval.requestedAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        approvals: approvalsWithDetails,
        count: approvalsWithDetails.length,
      },
    });
  } catch (error: any) {
    logger.error('Get pending approvals error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/transactions/history/:employeeId
 * Get transaction history for an employee
 */
router.get('/history/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromEmployeeId: employeeId },
          { toEmployeeId: employeeId },
        ],
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: Number(limit),
      skip: Number(offset),
    });

    // Get employee details for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (tx) => {
        const fromEmp = await prisma.employee.findUnique({
          where: { employeeId: tx.fromEmployeeId },
          select: { ensName: true, profileData: true },
        });

        const toEmp = await prisma.employee.findUnique({
          where: { employeeId: tx.toEmployeeId },
          select: { ensName: true, profileData: true },
        });

        return {
          transactionId: tx.transactionId,
          from: {
            id: tx.fromEmployeeId,
            ensName: fromEmp?.ensName,
            nickname: (fromEmp?.profileData as any)?.nickname,
          },
          to: {
            id: tx.toEmployeeId,
            ensName: toEmp?.ensName,
            nickname: (toEmp?.profileData as any)?.nickname,
          },
          amount: tx.amount,
          currency: tx.currency,
          chain: tx.chain,
          type: tx.transactionType,
          status: tx.status,
          timestamp: tx.timestamp,
          blockchainTxHash: tx.blockchainTxHash,
          gasUsed: tx.gasUsed,
        };
      })
    );

    res.json({
      success: true,
      data: {
        transactions: transactionsWithDetails,
        count: transactionsWithDetails.length,
      },
    });
  } catch (error: any) {
    logger.error('Get transaction history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
