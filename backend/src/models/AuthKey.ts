import prisma from '../config/database';
import { AuthKey, Prisma } from '@prisma/client';

// Type exports for AuthKey
export type IAuthKey = AuthKey;
export type AuthKeyCreateInput = Prisma.AuthKeyCreateInput;
export type AuthKeyUpdateInput = Prisma.AuthKeyUpdateInput;
export type AuthKeyWhereInput = Prisma.AuthKeyWhereInput;
export type AuthKeyWhereUniqueInput = Prisma.AuthKeyWhereUniqueInput;

// Helper functions for AuthKey operations
export const AuthKeyModel = {
  // Create
  create: async (data: AuthKeyCreateInput) => {
    return prisma.authKey.create({ data });
  },

  // Find one
  findOne: async (where: AuthKeyWhereUniqueInput) => {
    return prisma.authKey.findUnique({ where });
  },

  // Find many
  findMany: async (params?: {
    where?: AuthKeyWhereInput;
    orderBy?: Prisma.AuthKeyOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) => {
    return prisma.authKey.findMany(params);
  },

  // Update
  update: async (where: AuthKeyWhereUniqueInput, data: AuthKeyUpdateInput) => {
    return prisma.authKey.update({ where, data });
  },

  // Delete
  delete: async (where: AuthKeyWhereUniqueInput) => {
    return prisma.authKey.delete({ where });
  },

  // Count
  count: async (where?: AuthKeyWhereInput) => {
    return prisma.authKey.count({ where });
  },

  // Find by keyHash
  findByKeyHash: async (keyHash: string) => {
    return prisma.authKey.findUnique({
      where: { keyHash },
    });
  },

  // Find unused keys for organization
  findUnusedKeys: async (organizationId: string) => {
    return prisma.authKey.findMany({
      where: {
        organizationId,
        status: 'UNUSED',
      },
    });
  },

  // Direct access to Prisma client
  prisma: prisma.authKey,
};

export default AuthKeyModel;
