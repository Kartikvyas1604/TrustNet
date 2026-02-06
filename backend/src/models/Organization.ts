import prisma from '../config/database';
import { Organization, Prisma } from '@prisma/client';

// Type exports for Organization
export type IOrganization = Organization;
export type OrganizationCreateInput = Prisma.OrganizationCreateInput;
export type OrganizationUpdateInput = Prisma.OrganizationUpdateInput;
export type OrganizationWhereInput = Prisma.OrganizationWhereInput;
export type OrganizationWhereUniqueInput = Prisma.OrganizationWhereUniqueInput;

// Helper functions for Organization operations
export const OrganizationModel = {
  // Create
  create: async (data: OrganizationCreateInput) => {
    return prisma.organization.create({ data });
  },

  // Find one
  findOne: async (where: OrganizationWhereUniqueInput) => {
    return prisma.organization.findUnique({ where });
  },

  // Find many
  findMany: async (params?: {
    where?: OrganizationWhereInput;
    orderBy?: Prisma.OrganizationOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) => {
    return prisma.organization.findMany(params);
  },

  // Update
  update: async (where: OrganizationWhereUniqueInput, data: OrganizationUpdateInput) => {
    return prisma.organization.update({ where, data });
  },

  // Delete
  delete: async (where: OrganizationWhereUniqueInput) => {
    return prisma.organization.delete({ where });
  },

  // Count
  count: async (where?: OrganizationWhereInput) => {
    return prisma.organization.count({ where });
  },

  // Find by organizationId
  findByOrganizationId: async (organizationId: string) => {
    return prisma.organization.findUnique({
      where: { organizationId },
    });
  },

  // Find with employees
  findWithEmployees: async (organizationId: string) => {
    return prisma.organization.findUnique({
      where: { organizationId },
      include: { employees: true },
    });
  },

  // Direct access to Prisma client
  prisma: prisma.organization,
};

export default OrganizationModel;
