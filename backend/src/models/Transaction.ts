import prisma from '../config/database';
import { Transaction, Prisma } from '@prisma/client';

// Type exports for Transaction
export type ITransaction = Transaction;
export type TransactionCreateInput = Prisma.TransactionCreateInput;
export type TransactionUpdateInput = Prisma.TransactionUpdateInput;
export type TransactionWhereInput = Prisma.TransactionWhereInput;
export type TransactionWhereUniqueInput = Prisma.TransactionWhereUniqueInput;

// Helper functions for Transaction operations
export const TransactionModel = {
  // Create
  create: async (data: TransactionCreateInput) => {
    return prisma.transaction.create({ data });
  },

  // Find one
  findOne: async (where: TransactionWhereUniqueInput) => {
    return prisma.transaction.findUnique({ where });
  },

  // Find many
  findMany: async (params?: {
    where?: TransactionWhereInput;
    orderBy?: Prisma.TransactionOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) => {
    return prisma.transaction.findMany(params);
  },

  // Update
  update: async (where: TransactionWhereUniqueInput, data: TransactionUpdateInput) => {
    return prisma.transaction.update({ where, data });
  },

  // Delete
  delete: async (where: TransactionWhereUniqueInput) => {
    return prisma.transaction.delete({ where });
  },

  // Count
  count: async (where?: TransactionWhereInput) => {
    return prisma.transaction.count({ where });
  },

  // Find by transactionId
  findByTransactionId: async (transactionId: string) => {
    return prisma.transaction.findUnique({
      where: { transactionId },
    });
  },

  // Find by organization with pagination
  findByOrganization: async (
    organizationId: string,
    page: number = 1,
    pageSize: number = 50
  ) => {
    return prisma.transaction.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  },

  // Find by employee
  findByEmployee: async (employeeId: string) => {
    return prisma.transaction.findMany({
      where: {
        OR: [{ fromEmployeeId: employeeId }, { toEmployeeId: employeeId }],
      },
      orderBy: { timestamp: 'desc' },
    });
  },

  // Find by blockchain hash
  findByTxHash: async (blockchainTxHash: string) => {
    return prisma.transaction.findFirst({
      where: { blockchainTxHash },
    });
  },

  // Direct access to Prisma client
  prisma: prisma.transaction,
};

export default TransactionModel;
