import crypto from 'crypto';
import MerkleTree from '../models/MerkleTree';
import { prisma } from '../config/database';

class MerkleTreeService {
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async getTree(orgId: string) {
    let tree = await prisma.merkleTree.findFirst({ where: { organizationId: orgId } });

    if (!tree) {
      tree = await prisma.merkleTree.create({
        data: {
          organizationId: orgId,
          treeRoot: this.hash('GENESIS'),
          treeHeight: 0,
          leaves: [] as any,
          previousRoots: [] as any,
          lastUpdatedAt: new Date(),
        },
      });
    }

    return tree;
  }

  async addLeaf(orgId: string, leafData: string) {
    const tree = await this.getTree(orgId);

    const leafHash = this.hash(leafData);
    const leaves = (tree.leaves as any) || [];
    const newLeaves = [...leaves, { index: leaves.length, hash: leafHash }];

    const newRoot = this.computeRoot(newLeaves.map((l: any) => l.hash));
    
    const previousRoots = (tree.previousRoots as any) || [];
    const updatedPreviousRoots = [...previousRoots, tree.treeRoot];

    const updatedTree = await prisma.merkleTree.update({
      where: { id: tree.id },
      data: {
        leaves: newLeaves as any,
        treeRoot: newRoot,
        previousRoots: updatedPreviousRoots as any,
        lastUpdatedAt: new Date(),
      },
    });

    return updatedTree;
  }

  computeRoot(leaves: string[]): string {
    if (leaves.length === 0) return this.hash('EMPTY');

    let level = leaves;
    while (level.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left;
        next.push(this.hash(left + right));
      }
      level = next;
    }
    return level[0];
  }
}

export default new MerkleTreeService();
