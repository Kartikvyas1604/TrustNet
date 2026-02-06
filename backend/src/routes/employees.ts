import { Router, Request, Response } from 'express';
import EmployeeService from '../services/EmployeeService';

const router = Router();

/**
 * POST /api/employees/onboard
 * Onboard employee with auth key
 */
router.post('/onboard', async (req: Request, res: Response) => {
  try {
    const { authKey, walletAddress, chain, nickname, email } = req.body;

    if (!authKey || !walletAddress || !chain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: authKey, walletAddress, chain',
      });
    }

    if (!['ethereum', 'sui', 'base'].includes(chain)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chain. Must be: ethereum, sui, or base',
      });
    }

    const employee = await EmployeeService.onboardEmployee({
      authKey,
      walletAddress,
      chain,
      nickname,
      email,
    });

    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee onboarded successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/employees/validate-key
 * Validate auth key without onboarding
 */
router.post('/validate-key', async (req: Request, res: Response) => {
  try {
    const { authKey } = req.body;

    if (!authKey) {
      return res.status(400).json({
        success: false,
        error: 'Auth key required',
      });
    }

    const result = await EmployeeService.validateAuthKey(authKey);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/employees/:id
 * Get employee details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await EmployeeService.getEmployee(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/employees/organization/:orgId
 * Get all employees for an organization
 */
router.get('/organization/:orgId', async (req: Request, res: Response) => {
  try {
    const employees = await EmployeeService.getOrganizationEmployees(req.params.orgId);

    res.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/employees/:id/wallet
 * Add wallet address to employee
 */
router.put('/:id/wallet', async (req: Request, res: Response) => {
  try {
    const { chain, walletAddress } = req.body;

    if (!chain || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Chain and wallet address required',
      });
    }

    const employee = await EmployeeService.addWalletAddress(req.params.id, chain, walletAddress);

    res.json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/employees/:id/profile
 * Update employee profile
 */
router.patch('/:id/profile', async (req: Request, res: Response) => {
  try {
    const { nickname, avatar, email } = req.body;

    const employee = await EmployeeService.updateProfile(req.params.id, {
      nickname,
      avatar,
      email,
    });

    res.json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/employees/:id/status
 * Update employee status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'revoked'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    const employee = await EmployeeService.updateStatus(req.params.id, status);

    res.json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
