import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import TransactionService from '../services/TransactionService';
import transactionOrchestrationService from '../services/TransactionOrchestrationService';
import { sendSuccess, sendError, sendValidationError } from '../utils/response';
import { isValidAmount } from '../utils/validation';
import { PrivacyLevel, TransactionType } from '../types';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/transactions/send
 * Send transaction between employees or to external addresses
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { fromEmployeeId, recipient, amount, currency, chain, privacyLevel, memo } = req.body;

    if (!fromEmployeeId || !recipient || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromEmployeeId, recipient, amount',
      });
    }

    // Default to Base Sepolia for all transactions
    const txChain = chain || 'base';
    const txCurrency = currency || 'USDC';

    // Check if recipient is internal (ENS name or known wallet address)
    let toEmployeeId = null;
    let isInternal = false;

    // Check if recipient is an ENS name
    if (recipient.endsWith('.eth')) {
      const employee = await prisma.employee.findFirst({
        where: { ensName: recipient },
      });
      if (employee) {
        toEmployeeId = employee.employeeId;
        isInternal = true;
      }
    } else {
      // Check if it's a known wallet address
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
        toEmployeeId = employee.employeeId;
        isInternal = true;
      }
    }

    // For internal transactions, use enhanced privacy by default
    const txPrivacyLevel = isInternal 
      ? (privacyLevel || PrivacyLevel.ORGANIZATION_ONLY) 
      : PrivacyLevel.PUBLIC;

    const transaction = await TransactionService.sendTransaction({
      fromEmployeeId,
      toEmployeeId: toEmployeeId || recipient,
      amount,
      currency: txCurrency,
      chain: txChain,
      transactionType: 'sui_direct',
      privacyLevel: txPrivacyLevel,
      memo,
    });

    res.status(201).json({
      success: true,
      data: transaction,
      isInternal,
      message: isInternal 
        ? 'Internal transaction initiated (hidden from public blockchain scanners)' 
        : 'External transaction initiated',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/transactions/orchestrated
 * Create and process transaction using orchestration service (Yellow/Uniswap/Sui routing)
 */
router.post('/orchestrated', async (req: Request, res: Response) => {
  try {
    const {
      organizationId,
      employeeId,
      recipient,
      amount,
      privacyLevel,
      memo,
      metadata,
    } = req.body;

    // Validate required fields
    if (!organizationId || !employeeId || !recipient || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: organizationId, employeeId, recipient, amount'
      });
    }

    // Validate amount
    if (!isValidAmount(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount format'
      });
    }

    // Process transaction through orchestration service
    const result = await transactionOrchestrationService.processTransaction({
      fromEmployeeId: employeeId,
      toEmployeeId: recipient,
      toAddress: recipient,
      toEnsName: recipient,
      amount: amount,
      currency: 'USDC',
      chain: 'sui',
      privacyLevel: (privacyLevel as any) || 'ORGANIZATION_ONLY',
      memo,
    });

    // Return success response
    return res.status(201).json({
      success: true,
      data: result,
      message: 'Transaction processed successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/transactions/:id
 * Get transaction details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await TransactionService.getTransaction(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/transactions/employee/:employeeId
 * Get employee transactions
 */
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await TransactionService.getEmployeeTransactions(req.params.employeeId, limit);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/transactions/organization/:orgId
 * Get organization transactions
 */
router.get('/organization/:orgId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const transactions = await TransactionService.getOrganizationTransactions(req.params.orgId, limit);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/transactions/employee/:employeeId/stats
 * Get employee transaction statistics
 */
router.get('/employee/:employeeId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await TransactionService.getEmployeeStats(req.params.employeeId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/transactions/organization/:orgId/stats
 * Get organization transaction statistics
 */
router.get('/organization/:orgId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await TransactionService.getOrganizationStats(req.params.orgId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/transactions/:id/confirm
 * Confirm transaction
 */
router.patch('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { blockchainTxHash } = req.body;

    const transaction = await TransactionService.confirmTransaction(req.params.id, blockchainTxHash);

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/transactions/employee/:employeeId/pending
 * Get pending transactions for employee
 */
router.get('/employee/:employeeId/pending', async (req: Request, res: Response) => {
  try {
    const transactions = await TransactionService.getPendingTransactions(req.params.employeeId);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
