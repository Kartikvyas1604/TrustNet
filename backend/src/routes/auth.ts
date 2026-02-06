import express, { Router, Request, Response } from 'express';
import authService from '../services/AuthenticationService';
import securityMiddleware from '../middleware/SecurityMiddleware';
import logger from '../utils/logger';
import { body } from 'express-validator';
import Employee from '../models/Employee';
import { prisma } from '../config/database';

const router: Router = express.Router();

/**
 * @route   POST /api/auth/challenge
 * @desc    Generate authentication challenge for wallet signature (SIWE)
 * @access  Public
 */
router.post(
  '/challenge',
  securityMiddleware.authRateLimiter(),
  securityMiddleware.validate([
    body('address').isEthereumAddress().withMessage('Valid Ethereum address is required'),
    body('domain').optional().isString().withMessage('Domain must be a string'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { address, domain } = req.body;

      const challenge = authService.generateChallenge(address, domain);

      logger.info(`Generated auth challenge for ${address}`);

      res.json({
        success: true,
        data: {
          nonce: challenge.nonce,
          message: challenge.message,
          expiresAt: challenge.expiresAt,
        },
      });
    } catch (error: any) {
      logger.error('Failed to generate challenge:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate challenge',
      });
    }
  }
);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify wallet signature and create session
 * @access  Public
 */
router.post(
  '/verify',
  securityMiddleware.authRateLimiter(),
  securityMiddleware.validate([
    body('message').isString().notEmpty().withMessage('Message is required'),
    body('signature').isString().notEmpty().withMessage('Signature is required'),
    body('nonce').isString().notEmpty().withMessage('Nonce is required'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { message, signature, nonce } = req.body;

      // Verify signature
      const verificationResult = await authService.verifySignature(message, signature, nonce);

      if (!verificationResult.valid || !verificationResult.address) {
        return res.status(401).json({
          success: false,
          error: 'Invalid signature or expired challenge',
        });
      }

      // Check if employee exists
      const employees = await prisma.employee.findMany({
        where: {
          status: 'ACTIVE',
        }
      });
      
      const employee = employees.find((emp: any) => {
        const wallets = emp.walletAddresses as any;
        return wallets?.ethereum === verificationResult.address;
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found or not active',
        });
      }

      // Create session
      const session = await authService.createSession(
        verificationResult.address,
        employee.organizationId,
        employee.employeeId,
        'employee' // Default role, can be customized
      );

      logger.info(`User authenticated: ${verificationResult.address}`);

      res.json({
        success: true,
        data: {
          token: session.token,
          sessionId: session.sessionId,
          address: verificationResult.address,
          employeeId: employee.employeeId,
          organizationId: employee.organizationId,
          ensName: employee.ensName,
        },
      });
    } catch (error: any) {
      logger.error('Failed to verify signature:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Authentication failed',
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private (requires valid token)
 */
router.post(
  '/refresh',
  securityMiddleware.authenticate(),
  async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const oldToken = authHeader?.substring(7);

      if (!oldToken) {
        return res.status(401).json({
          success: false,
          error: 'Token required',
        });
      }

      const newToken = authService.refreshToken(oldToken);

      if (!newToken) {
        return res.status(401).json({
          success: false,
          error: 'Failed to refresh token',
        });
      }

      res.json({
        success: true,
        data: {
          token: newToken,
        },
      });
    } catch (error: any) {
      logger.error('Failed to refresh token:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to refresh token',
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout and invalidate session
 * @access  Private
 */
router.post(
  '/logout',
  securityMiddleware.authenticate(),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      await authService.invalidateSession(user.sessionId);

      logger.info(`User logged out: ${user.address}`);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      logger.error('Failed to logout:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Logout failed',
      });
    }
  }
);

/**
 * @route   GET /api/auth/session
 * @desc    Get current session info
 * @access  Private
 */
router.get(
  '/session',
  securityMiddleware.authenticate(),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const permissions = authService.getRolePermissions(user.role);

      res.json({
        success: true,
        data: {
          address: user.address,
          organizationId: user.organizationId,
          employeeId: user.employeeId,
          role: user.role,
          permissions,
          sessionId: user.sessionId,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get session info:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get session info',
      });
    }
  }
);

export default router;
