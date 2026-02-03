import { ethers } from 'ethers';
import * as jwt from 'jsonwebtoken';
import { SiweMessage } from 'siwe';
import { nanoid } from 'nanoid';
import logger from '../utils/logger';
import redisService from './RedisService';

interface JWTPayload {
  address: string;
  organizationId?: string;
  employeeId?: string;
  role: string;
  sessionId: string;
}

interface SignatureChallenge {
  nonce: string;
  message: string;
  expiresAt: number;
}

interface RolePermissions {
  canManageEmployees: boolean;
  canViewTransactions: boolean;
  canInitiateTransactions: boolean;
  canManageOrganization: boolean;
  canAccessAuditLogs: boolean;
}

class AuthenticationService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string = '24h';
  private readonly CHALLENGE_EXPIRY: number = 300000; // 5 minutes
  private challenges: Map<string, SignatureChallenge> = new Map();

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    if (this.JWT_SECRET === 'your-secret-key-change-in-production') {
      logger.warn('Using default JWT secret - please set JWT_SECRET in production!');
    }
  }

  /**
   * Generate a challenge for wallet signature authentication (SIWE)
   */
  generateChallenge(address: string, domain: string = 'trustnet.app'): SignatureChallenge {
    try {
      const nonce = nanoid(32);
      const expiresAt = Date.now() + this.CHALLENGE_EXPIRY;

      // Create SIWE message
      const siweMessage = new SiweMessage({
        domain,
        address: ethers.getAddress(address), // Validate and checksum address
        statement: 'Sign in to TrustNet Enterprise Platform',
        uri: `https://${domain}`,
        version: '1',
        chainId: 1, // Ethereum mainnet
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(expiresAt).toISOString(),
      });

      const message = siweMessage.prepareMessage();

      const challenge: SignatureChallenge = {
        nonce,
        message,
        expiresAt,
      };

      // Store challenge
      this.challenges.set(nonce, challenge);

      logger.info(`Generated authentication challenge for ${address}`);

      // Clean up expired challenges
      this.cleanupExpiredChallenges();

      return challenge;
    } catch (error) {
      logger.error('Failed to generate challenge:', error);
      throw error;
    }
  }

  /**
   * Verify wallet signature against challenge
   */
  async verifySignature(
    message: string,
    signature: string,
    nonce: string
  ): Promise<{ valid: boolean; address?: string }> {
    try {
      const challenge = this.challenges.get(nonce);

      if (!challenge) {
        logger.warn(`Challenge not found for nonce: ${nonce}`);
        return { valid: false };
      }

      if (Date.now() > challenge.expiresAt) {
        logger.warn(`Challenge expired for nonce: ${nonce}`);
        this.challenges.delete(nonce);
        return { valid: false };
      }

      if (message !== challenge.message) {
        logger.warn(`Message mismatch for nonce: ${nonce}`);
        return { valid: false };
      }

      // Verify SIWE message
      const siweMessage = new SiweMessage(message);
      const fields = await siweMessage.verify({ signature });

      if (fields.success) {
        // Clean up used challenge
        this.challenges.delete(nonce);
        
        logger.info(`Signature verified successfully for ${fields.data.address}`);
        
        return {
          valid: true,
          address: fields.data.address,
        };
      }

      return { valid: false };
    } catch (error) {
      logger.error('Failed to verify signature:', error);
      return { valid: false };
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateToken(payload: JWTPayload): string {
    try {
      const token = jwt.sign(
        payload,
        this.JWT_SECRET,
        {
          expiresIn: this.JWT_EXPIRES_IN,
          issuer: 'trustnet-backend',
          subject: payload.address,
        } as jwt.SignOptions
      );

      logger.info(`Generated JWT token for ${payload.address}`);

      return token;
    } catch (error) {
      logger.error('Failed to generate JWT token:', error);
      throw error;
    }
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'trustnet-backend',
      }) as JWTPayload;

      logger.debug(`JWT token verified for ${decoded.address}`);

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('JWT token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid JWT token');
      } else {
        logger.error('Failed to verify JWT token:', error);
      }
      return null;
    }
  }

  /**
   * Create authenticated session
   */
  async createSession(
    address: string,
    organizationId?: string,
    employeeId?: string,
    role: string = 'employee'
  ): Promise<{ token: string; sessionId: string }> {
    try {
      const sessionId = nanoid(32);

      const payload: JWTPayload = {
        address: ethers.getAddress(address),
        organizationId,
        employeeId,
        role,
        sessionId,
      };

      const token = this.generateToken(payload);

      // Store session in Redis
      await redisService.setSession(sessionId, {
        address: payload.address,
        organizationId,
        employeeId,
        role,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });

      logger.info(`Created session for ${address}: ${sessionId}`);

      return { token, sessionId };
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Validate session and update last activity
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await redisService.getSession(sessionId);

      if (!session) {
        return false;
      }

      // Update last activity
      session.lastActivity = Date.now();
      await redisService.setSession(sessionId, session);

      return true;
    } catch (error) {
      logger.error('Failed to validate session:', error);
      return false;
    }
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      await redisService.deleteSession(sessionId);
      logger.info(`Session invalidated: ${sessionId}`);
    } catch (error) {
      logger.error('Failed to invalidate session:', error);
      throw error;
    }
  }

  /**
   * Get role-based permissions
   */
  getRolePermissions(role: string): RolePermissions {
    const permissions: Record<string, RolePermissions> = {
      owner: {
        canManageEmployees: true,
        canViewTransactions: true,
        canInitiateTransactions: true,
        canManageOrganization: true,
        canAccessAuditLogs: true,
      },
      admin: {
        canManageEmployees: true,
        canViewTransactions: true,
        canInitiateTransactions: true,
        canManageOrganization: false,
        canAccessAuditLogs: true,
      },
      finance: {
        canManageEmployees: false,
        canViewTransactions: true,
        canInitiateTransactions: true,
        canManageOrganization: false,
        canAccessAuditLogs: true,
      },
      employee: {
        canManageEmployees: false,
        canViewTransactions: true,
        canInitiateTransactions: true,
        canManageOrganization: false,
        canAccessAuditLogs: false,
      },
    };

    return permissions[role] || permissions.employee;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(role: string, permission: keyof RolePermissions): boolean {
    const permissions = this.getRolePermissions(role);
    return permissions[permission];
  }

  /**
   * Clean up expired challenges
   */
  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [nonce, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt) {
        this.challenges.delete(nonce);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired challenges`);
    }
  }

  /**
   * Refresh JWT token
   */
  refreshToken(oldToken: string): string | null {
    try {
      const decoded = this.verifyToken(oldToken);
      
      if (!decoded) {
        return null;
      }

      // Generate new token with same payload
      const newToken = this.generateToken(decoded);

      logger.info(`Refreshed token for ${decoded.address}`);

      return newToken;
    } catch (error) {
      logger.error('Failed to refresh token:', error);
      return null;
    }
  }
}

export default new AuthenticationService();
