import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { IEmployee, OnboardEmployeeRequest } from '../types';
import AuthKey from '../models/AuthKey';
import { EmployeeModel } from '../models/Employee';
import { OrganizationModel } from '../models/Organization';
import MerkleTreeService from './MerkleTreeService';
import logger from '../utils/logger';

class EmployeeService {
  /**
   * Onboard a new employee using an auth key
   */
  async onboardEmployee(input: OnboardEmployeeRequest): Promise<IEmployee> {
    // Find all unused auth keys and check against the provided key
    const authKeys = await AuthKey.findMany({ 
      where: { status: 'UNUSED' } 
    });

    let matchedKey = null;
    for (const key of authKeys) {
      const isMatch = await bcrypt.compare(input.authKey, key.keyHash);
      if (isMatch) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      throw new Error('Invalid or already used auth key');
    }

    // Get organization details
    const organization = await OrganizationModel.findOne({
      organizationId: matchedKey.organizationId,
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    if (organization.kycStatus !== 'APPROVED') {
      throw new Error('Organization KYC not approved');
    }

    // Check if wallet already exists
    const existingEmployees = await EmployeeModel.findByWallet(input.walletAddress);

    if (existingEmployees && existingEmployees.length > 0) {
      throw new Error('Wallet address already registered');
    }

    // Generate employee ID
    const employeeId = `emp_${crypto.randomBytes(8).toString('hex')}`;

    // Generate ENS name based on profileData
    const nickname = input.profileData?.nickname;
    const ensName = nickname
      ? `${nickname.toLowerCase()}.${organization.organizationId}.eth`
      : `${employeeId}.${organization.organizationId}.eth`;

    // Hash the auth key
    const authKeyHash = crypto.createHash('sha256').update(input.authKey).digest('hex');

    // Prepare wallet addresses object
    const walletAddresses: any = {};
    walletAddresses[input.chain] = input.walletAddress;

    // Create employee record
    const employee = await EmployeeModel.create({
      employeeId,
      organization: {
        connect: { organizationId: matchedKey.organizationId }
      },
      walletAddresses,
      authKeyHash,
      ensName,
      profileData: input.profileData || {},
      status: 'ACTIVE',
      privacyPreferences: {
        defaultPrivacyLevel: 'ORGANIZATION_ONLY',
        preferredChain: input.chain,
      }
    });

    // Add employee to organization's Merkle tree
    await MerkleTreeService.addLeaf(
      matchedKey.organizationId,
      employee.employeeId
    );

    // Update auth key status
    await AuthKey.update(matchedKey.id, {
      status: 'ACTIVE',
      assignedEmployeeId: employeeId,
      usedAt: new Date(),
    });

    logger.info(`Employee onboarded: ${employeeId} for organization: ${matchedKey.organizationId}`);
    
    return employee;
  }

  /**
   * Get employee by ID
   */
  async getEmployee(employeeId: string): Promise<IEmployee | null> {
    return await EmployeeModel.findByEmployeeId(employeeId);
  }

  /**
   * Get employee by wallet address
   */
  async getEmployeeByWallet(walletAddress: string): Promise<IEmployee | null> {
    const employees = await EmployeeModel.findByWallet(walletAddress);
    return employees.length > 0 ? employees[0] : null;
  }

  /**
   * Get all employees for an organization
   */
  async getOrganizationEmployees(organizationId: string): Promise<IEmployee[]> {
    return await EmployeeModel.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      orderBy: {
        onboardingDate: 'desc'
      }
    });
  }

  /**
   * Add additional wallet address to employee
   */
  async addWalletAddress(
    employeeId: string,
    chain: 'ethereum' | 'sui' | 'base',
    walletAddress: string
  ): Promise<IEmployee | null> {
    // Check if wallet already exists
    const existingEmployees = await EmployeeModel.findByWallet(walletAddress);
    const existingEmployee = existingEmployees.length > 0 ? existingEmployees[0] : null;

    if (existingEmployee && existingEmployee.employeeId !== employeeId) {
      throw new Error('Wallet address already registered to another employee');
    }

    const employee = await EmployeeModel.findByEmployeeId(employeeId);

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Update wallet addresses
    const walletAddresses = { ...employee.walletAddresses as any };
    walletAddresses[chain] = walletAddress;

    const updatedEmployee = await EmployeeModel.update(
      { employeeId },
      { walletAddresses }
    );

    logger.info(`Added ${chain} wallet for employee: ${employeeId}`);
    return updatedEmployee;
  }

  /**
   * Update employee profile
   */
  async updateProfile(
    employeeId: string,
    profileData: {
      nickname?: string;
      avatar?: string;
      email?: string;
      phoneNumber?: string;
    }
  ): Promise<IEmployee | null> {
    const employee = await EmployeeModel.findByEmployeeId(employeeId);

    if (!employee) {
      throw new Error('Employee not found');
    }

    const currentProfile = { ...employee.profileData as any };
    const updatedProfile = { ...currentProfile, ...profileData };

    const updatedEmployee = await EmployeeModel.update(
      { employeeId },
      { profileData: updatedProfile }
    );

    logger.info(`Updated profile for employee: ${employeeId}`);
    return updatedEmployee;
  }

  /**
   * Update employee status
   */
  async updateStatus(
    employeeId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED'
  ): Promise<IEmployee | null> {
    const updatedEmployee = await EmployeeModel.update(
      { employeeId },
      { status: status as any }
    );

    logger.info(`Updated status for employee ${employeeId} to ${status}`);
    return updatedEmployee;
  }

  /**
   * Revoke employee access
   */
  async revokeAccess(employeeId: string): Promise<void> {
    await this.updateStatus(employeeId, 'REVOKED');
    logger.info(`Revoked access for employee: ${employeeId}`);
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(employeeId: string): Promise<any> {
    const employee = await EmployeeModel.findByEmployeeId(employeeId);

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Would need to query transactions separately
    return {
      employeeId: employee.employeeId,
      totalSent: 0,
      totalReceived: 0,
      status: employee.status,
      onboardingDate: employee.onboardingDate,
    };
  }
}

export default new EmployeeService();
