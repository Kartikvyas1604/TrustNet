import prisma from '../config/database';
import { Employee, Prisma } from '@prisma/client';

// Type exports for Employee
export type IEmployee = Employee;
export type EmployeeCreateInput = Prisma.EmployeeCreateInput;
export type EmployeeUpdateInput = Prisma.EmployeeUpdateInput;
export type EmployeeWhereInput = Prisma.EmployeeWhereInput;
export type EmployeeWhereUniqueInput = Prisma.EmployeeWhereUniqueInput;

// Helper functions for Employee operations
export const EmployeeModel = {
  // Create
  create: async (data: EmployeeCreateInput) => {
    return prisma.employee.create({ data });
  },

  // Find one
  findOne: async (where: EmployeeWhereUniqueInput) => {
    return prisma.employee.findUnique({ where });
  },

  // Find many
  findMany: async (params?: {
    where?: EmployeeWhereInput;
    orderBy?: Prisma.EmployeeOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) => {
    return prisma.employee.findMany(params);
  },

  // Update
  update: async (where: EmployeeWhereUniqueInput, data: EmployeeUpdateInput) => {
    return prisma.employee.update({ where, data });
  },

  // Delete
  delete: async (where: EmployeeWhereUniqueInput) => {
    return prisma.employee.delete({ where });
  },

  // Count
  count: async (where?: EmployeeWhereInput) => {
    return prisma.employee.count({ where });
  },

  // Find by employeeId
  findByEmployeeId: async (employeeId: string) => {
    return prisma.employee.findUnique({
      where: { employeeId },
    });
  },

  // Find by organization
  findByOrganization: async (organizationId: string) => {
    return prisma.employee.findMany({
      where: { organizationId },
    });
  },

  // Find by wallet address
  findByWallet: async (walletAddress: string) => {
    return prisma.employee.findMany({
      where: {
        OR: [
          { walletAddresses: { path: ['ethereum'], equals: walletAddress } },
          { walletAddresses: { path: ['base'], equals: walletAddress } },
          { walletAddresses: { path: ['sui'], equals: walletAddress } },
          { walletAddresses: { path: ['polygon'], equals: walletAddress } },
          { walletAddresses: { path: ['arbitrum'], equals: walletAddress } },
          { walletAddresses: { path: ['arc'], equals: walletAddress } },
        ],
      },
    });
  },

  // Direct access to Prisma client
  prisma: prisma.employee,
};

export default EmployeeModel;
