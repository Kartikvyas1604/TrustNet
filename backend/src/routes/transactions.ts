import { Router, Request, Response } from 'express';
import TransactionService from '../services/TransactionService';

const router = Router();

/**
 * POST /api/transactions/send
 * Send transaction between employees
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { fromEmployeeId, toEmployeeId, amount, currency, chain, transactionType, privacyLevel, memo } = req.body;

    if (!fromEmployeeId || !toEmployeeId || !amount || !chain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromEmployeeId, toEmployeeId, amount, chain',
      });
    }

    const transaction = await TransactionService.sendTransaction({
      fromEmployeeId,
      toEmployeeId,
      amount,
      currency: currency || 'USDC',
      chain,
      transactionType,
      privacyLevel,
      memo,
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction initiated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
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
