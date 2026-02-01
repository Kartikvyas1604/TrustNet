import { Router, Request, Response } from 'express';
import OrganizationService from '../services/OrganizationService';

const router = Router();

/**
 * POST /api/organizations/register
 * Register a new organization
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, registrationNumber, country, subscriptionTier, adminWallet, contactEmail, contactPerson } = req.body;

    // Validate required fields
    if (!name || !registrationNumber || !country || !adminWallet || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const organization = await OrganizationService.registerOrganization({
      name,
      registrationNumber,
      country,
      subscriptionTier: subscriptionTier || 'starter',
      adminWallet,
      contactEmail,
      contactPerson,
    });

    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/organizations/:id
 * Get organization details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organization = await OrganizationService.getOrganization(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    res.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/organizations/:id/generate-keys
 * Generate auth keys for organization
 */
router.post('/:id/generate-keys', async (req: Request, res: Response) => {
  try {
    const { count, generatedBy } = req.body;

    if (!count || count < 1 || count > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Count must be between 1 and 1000',
      });
    }

    const keys = await OrganizationService.generateAuthKeys(
      req.params.id,
      count,
      generatedBy || 'api'
    );

    res.status(201).json({
      success: true,
      data: {
        keys,
        message: 'Auth keys generated successfully. Store these securely - they cannot be retrieved again.',
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/organizations/:id/kyc
 * Update KYC status
 */
router.patch('/:id/kyc', async (req: Request, res: Response) => {
  try {
    const { status, documents } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid KYC status',
      });
    }

    const organization = await OrganizationService.updateKYCStatus(
      req.params.id,
      status,
      documents
    );

    res.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/organizations/:id/stats
 * Get organization statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await OrganizationService.getOrganizationStats(req.params.id);

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
 * PUT /api/organizations/:id/treasury
 * Update treasury addresses
 */
router.put('/:id/treasury', async (req: Request, res: Response) => {
  try {
    const { ethereum, sui, base } = req.body;

    const organization = await OrganizationService.updateTreasuryAddresses(req.params.id, {
      ethereum,
      sui,
      base,
    });

    res.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
