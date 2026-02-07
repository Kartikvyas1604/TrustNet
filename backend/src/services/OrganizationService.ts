import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Organization, { IOrganization } from '../models/Organization';
import AuthKey from '../models/AuthKey';
import { prisma } from '../config/database';

interface RegisterOrganizationInput {
  name: string;
  registrationNumber: string;
  country: string;
  subscriptionTier: 'starter' | 'business' | 'enterprise';
  adminWallet: string;
  contactEmail: string;
  contactPerson: string;
}

class OrganizationService {
  /**
   * Register a new organization
   */
  async registerOrganization(input: RegisterOrganizationInput): Promise<IOrganization> {
    // Generate unique organization ID from name
    const organizationId = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if organization already exists
    const existing = await Organization.findOne({ organizationId });
    if (existing) {
      throw new Error('Organization with this name already exists');
    }

    // Determine employee limit based on subscription tier
    const employeeLimits = {
      starter: 10,
      business: 100,
      enterprise: 1000,
    };

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        organizationId,
        name: input.name,
        legalBusinessName: input.name, // Use name as legal business name for now
        registrationNumber: input.registrationNumber,
        country: input.country,
        businessAddress: { street: '', city: '', state: '', zip: '' }, // Placeholder
        adminName: input.contactPerson,
        adminEmail: input.contactEmail,
        adminPhone: '', // Placeholder - should be collected during registration
        adminJobTitle: 'Administrator', // Default value
        kycStatus: 'PENDING',
        subscriptionTier: input.subscriptionTier.toUpperCase() as any,
        employeeLimit: employeeLimits[input.subscriptionTier],
        adminWallets: [
          {
            address: input.adminWallet,
            role: 'owner',
          },
        ] as any,
        metadata: {
          contactEmail: input.contactEmail,
          contactPerson: input.contactPerson,
        } as any,
      },
    }) as any;

    console.log(`Organization registered: ${organizationId}`);
    return organization;
  }

  /**
   * Update organization KYC status
   */
  async updateKYCStatus(
    organizationId: string,
    status: 'approved' | 'rejected',
    documents?: string[]
  ): Promise<IOrganization | null> {
    const organization = await prisma.organization.update({
      where: { organizationId },
      data: {
        kycStatus: status.toUpperCase() as any,
        ...(documents && { kycDocuments: documents as any }),
      },
    }) as any;

    if (!organization) {
      throw new Error('Organization not found');
    }

    console.log(`Organization ${organizationId} KYC status updated to: ${status}`);
    return organization;
  }

  /**
   * Get all auth keys for an organization
   */
  async getAuthKeys(organizationId: string) {
    const organization = await Organization.findOne({ organizationId });
    if (!organization) {
      throw new Error('Organization not found');
    }

    const authKeys = await prisma.authKey.findMany({
      where: { organizationId },
      orderBy: { generatedAt: 'desc' },
    });

    return authKeys.map(key => ({
      id: key.id,
      keyHash: key.keyHash.substring(0, 20) + '...', // Truncate hash for display
      status: key.status,
      assignedEmployeeId: key.assignedEmployeeId,
      generatedAt: key.generatedAt,
      usedAt: key.usedAt,
      revokedAt: key.revokedAt,
      expiresAt: key.expiresAt,
    }));
  }

  /**
   * Generate auth keys for employees
   */
  async generateAuthKeys(
    organizationId: string,
    count: number,
    generatedBy: string
  ): Promise<Array<{ key: string; keyHash: string }>> {
    // Verify organization exists
    const organization = await Organization.findOne({ organizationId });
    if (!organization) {
      throw new Error('Organization not found');
    }

    if (organization.kycStatus !== 'APPROVED') {
      throw new Error('Organization must complete KYC before generating auth keys');
    }

    // Limit key generation
    if (count > organization.employeeLimit) {
      throw new Error(`Cannot generate more than ${organization.employeeLimit} keys`);
    }

    const keys: Array<{ key: string; keyHash: string }> = [];

    // Generate keys
    for (let i = 0; i < count; i++) {
      // Generate random 16-character key (XXXX-XXXX-XXXX-XXXX format)
      const randomBytes = crypto.randomBytes(12);
      const key = randomBytes
        .toString('base64')
        .replace(/[^A-Za-z0-9]/g, '')
        .substring(0, 16)
        .toUpperCase()
        .match(/.{1,4}/g)!
        .join('-');

      // Hash the key for storage
      const keyHash = await bcrypt.hash(key, 10);

      // Store in database
      await prisma.authKey.create({
        data: {
          keyHash,
          organizationId,
          status: 'UNUSED',
          metadata: {
            generatedBy,
          } as any,
        },
      });

      keys.push({ key, keyHash });
    }

    console.log(`Generated ${count} auth keys for organization: ${organizationId}`);
    return keys;
  }

  /**
   * Get organization details
   */
  async getOrganization(organizationId: string): Promise<IOrganization | null> {
    return await prisma.organization.findFirst({ where: { organizationId } }) as any;
  }

  /**
   * Get organization by admin wallet
   */
  async getOrganizationByAdmin(adminWallet: string): Promise<IOrganization | null> {
    const orgs = await prisma.organization.findMany();
    return orgs.find(org => {
      const wallets = org.adminWallets as any;
      return Array.isArray(wallets) && wallets.some((w: any) => w.address === adminWallet);
    }) as any || null;
  }

  /**
   * Update organization treasury addresses
   */
  async updateTreasuryAddresses(
    organizationId: string,
    treasuryAddresses: {
      ethereum?: string;
      sui?: string;
      base?: string;
    }
  ): Promise<IOrganization | null> {
    const organization = await prisma.organization.update({
      where: { organizationId },
      data: { treasuryAddresses: treasuryAddresses as any },
    }) as any;

    if (!organization) {
      throw new Error('Organization not found');
    }

    console.log(`Updated treasury addresses for: ${organizationId}`);
    return organization;
  }

  /**
   * Get available auth keys count
   */
  async getAvailableKeysCount(organizationId: string): Promise<number> {
    return await prisma.authKey.count({
      where: {
        organizationId,
        status: 'UNUSED',
      },
    });
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string) {
    const organization = await prisma.organization.findFirst({ where: { organizationId } });
    if (!organization) {
      throw new Error('Organization not found');
    }

    const totalKeys = await prisma.authKey.count({ where: { organizationId } });
    const usedKeys = await prisma.authKey.count({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    });
    const unusedKeys = await prisma.authKey.count({
      where: {
        organizationId,
        status: 'UNUSED',
      },
    });

    return {
      organization,
      stats: {
        totalKeys,
        usedKeys,
        unusedKeys,
        employeeLimit: organization.employeeLimit,
        remainingSlots: organization.employeeLimit - usedKeys,
      },
    };
  }
}

export default new OrganizationService();
