import prisma from '../config/database';
import { MerkleTree, Prisma } from '@prisma/client';

// Type exports for MerkleTree
export type IMerkleTree = MerkleTree;
export type MerkleTreeCreateInput = Prisma.MerkleTreeCreateInput;
export type MerkleTreeUpdateInput = Prisma.MerkleTreeUpdateInput;
export type MerkleTreeWhereInput = Prisma.MerkleTreeWhereInput;
export type MerkleTreeWhereUniqueInput = Prisma.MerkleTreeWhereUniqueInput;

// Helper functions for MerkleTree operations
export const MerkleTreeModel = {
  // Create
  create: async (data: MerkleTreeCreateInput) => {
    return prisma.merkleTree.create({ data });
  },

  // Find one
  findOne: async (where: MerkleTreeWhereUniqueInput) => {
    return prisma.merkleTree.findUnique({ where });
  },

  // Find many
  findMany: async (params?: {
    where?: MerkleTreeWhereInput;
    orderBy?: Prisma.MerkleTreeOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) => {
    return prisma.merkleTree.findMany(params);
  },

  // Update
  update: async (where: MerkleTreeWhereUniqueInput, data: MerkleTreeUpdateInput) => {
    return prisma.merkleTree.update({ where, data });
  },

  // Delete
  delete: async (where: MerkleTreeWhereUniqueInput) => {
    return prisma.merkleTree.delete({ where });
  },

  // Find by organizationId
  findByOrganization: async (organizationId: string) => {
    return prisma.merkleTree.findUnique({
      where: { organizationId },
    });
  },

  // Upsert (create or update)
  upsert: async (organizationId: string, data: MerkleTreeCreateInput) => {
    return prisma.merkleTree.upsert({
      where: { organizationId },
      create: data,
      update: data,
    });
  },

  // Direct access to Prisma client
  prisma: prisma.merkleTree,
};

export default MerkleTreeModel;
