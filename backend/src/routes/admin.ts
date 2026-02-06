import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/organizations
 * Get all organizations with filtering options
 */
router.get('/organizations', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const whereClause: any = {};
    
    if (status) {
      whereClause.kycStatus = status;
    }

    const organizations = await prisma.organization.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        legalBusinessName: true,
        registrationNumber: true,
        country: true,
        businessAddress: true,
        industry: true,
        websiteUrl: true,
        adminName: true,
        adminEmail: true,
        adminPhone: true,
        adminJobTitle: true,
        kycStatus: true,
        kycDocuments: true,
        verifiedAt: true,
        verificationNotes: true,
        subscriptionTier: true,
        employeeLimit: true,
        organizationType: true,
        adminWallets: true,
        paymentStatus: true,
        billingCycle: true,
        monthlyPrice: true,
        annualPrice: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get employee counts for each organization
    const orgsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const employeeCount = await prisma.employee.count({
          where: { organizationId: org.organizationId },
        });
        return {
          ...org,
          employeeCount,
        };
      })
    );

    res.json({
      success: true,
      organizations: orgsWithCounts,
    });
  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/organizations/pending
 * Get only pending organizations awaiting approval
 */
router.get('/organizations/pending', async (req: Request, res: Response) => {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        kycStatus: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        legalBusinessName: true,
        registrationNumber: true,
        country: true,
        businessAddress: true,
        industry: true,
        websiteUrl: true,
        adminName: true,
        adminEmail: true,
        adminPhone: true,
        adminJobTitle: true,
        kycStatus: true,
        kycDocuments: true,
        subscriptionTier: true,
        employeeLimit: true,
        organizationType: true,
        adminWallets: true,
        paymentStatus: true,
        billingCycle: true,
        monthlyPrice: true,
        annualPrice: true,
        createdAt: true,
      },
    });

    // Get employee counts for each organization
    const orgsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const employeeCount = await prisma.employee.count({
          where: { organizationId: org.organizationId },
        });
        return {
          ...org,
          employeeCount,
        };
      })
    );

    res.json({
      success: true,
      organizations: orgsWithCounts,
    });
  } catch (error: any) {
    console.error('Error fetching pending organizations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/organizations/:id/approve
 * Approve an organization
 */
router.put('/organizations/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    if (organization.kycStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Organization is not pending approval',
      });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        kycStatus: 'APPROVED',
        verifiedAt: new Date(),
        verificationNotes: notes || 'Approved by admin',
        updatedAt: new Date(),
      },
    });

    // Log the approval
    await prisma.auditLog.create({
      data: {
        logId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: organization.organizationId,
        eventType: 'ORGANIZATION_APPROVED',
        actorId: 'Admin',
        affectedEntityType: 'organization',
        affectedEntityId: organization.organizationId,
        metadata: {
          previousStatus: organization.kycStatus,
          newStatus: 'APPROVED',
          notes,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      success: true,
      message: 'Organization approved successfully',
      organization: updated,
    });
  } catch (error: any) {
    console.error('Error approving organization:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/organizations/:id/reject
 * Reject an organization
 */
router.put('/organizations/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    if (organization.kycStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Organization is not pending approval',
      });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        kycStatus: 'REJECTED',
        verificationNotes: reason,
        updatedAt: new Date(),
      },
    });

    // Log the rejection
    await prisma.auditLog.create({
      data: {
        logId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: organization.organizationId,
        eventType: 'ORGANIZATION_REJECTED',
        actorId: 'Admin',
        affectedEntityType: 'organization',
        affectedEntityId: organization.organizationId,
        metadata: {
          previousStatus: organization.kycStatus,
          newStatus: 'REJECTED',
          reason,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      success: true,
      message: 'Organization rejected',
      organization: updated,
    });
  } catch (error: any) {
    console.error('Error rejecting organization:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/organizations/:id
 * Get detailed information about a specific organization
 */
router.get('/organizations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employeeId: true,
            profileData: true,
            status: true,
            createdAt: true,
          },
        },
        transactions: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        auditLogs: {
          take: 20,
          orderBy: {
            createdAt: 'desc',
          },
        },
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
      organization,
    });
  } catch (error: any) {
    console.error('Error fetching organization details:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
