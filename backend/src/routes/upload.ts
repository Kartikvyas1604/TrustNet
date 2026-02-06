import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * POST /api/upload/kyc-documents
 * Upload KYC documents for organization
 */
router.post('/kyc-documents', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required',
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

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files were uploaded',
      });
    }

    const uploadedFiles: any = {};
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Process each file
    for (const fieldName in req.files) {
      const file: any = req.files[fieldName];

      // Validate file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file type for ${fieldName}. Only PDF, JPG, and PNG are allowed.`,
        });
      }

      // Validate file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `File ${fieldName} is too large. Maximum size is 5MB.`,
        });
      }

      // Generate unique filename
      const fileExtension = path.extname(file.name);
      const uniqueFilename = `${organizationId}-${fieldName}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      // Save file
      await file.mv(filePath);

      uploadedFiles[fieldName] = {
        originalName: file.name,
        filename: uniqueFilename,
        path: `/uploads/${uniqueFilename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString(),
      };
    }

    // Update organization with file paths
    const updatedOrg = await prisma.organization.update({
      where: { organizationId },
      data: {
        kycDocuments: uploadedFiles,
        kycStatus: 'PENDING', // Set to pending for admin review
      },
    });

    logger.info(`KYC documents uploaded for organization ${organizationId}`);

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      files: uploadedFiles,
      organization: {
        organizationId: updatedOrg.organizationId,
        name: updatedOrg.name,
        kycStatus: updatedOrg.kycStatus,
      },
    });
  } catch (error: any) {
    logger.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/upload/document/:filename
 * Serve uploaded document (protected route)
 */
router.get('/document/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Send file
    res.sendFile(filePath);
  } catch (error: any) {
    logger.error('File retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
