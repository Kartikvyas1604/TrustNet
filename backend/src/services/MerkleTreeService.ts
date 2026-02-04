import crypto from 'crypto';
import MerkleTree from '../models/MerkleTree';

class MerkleTreeService {
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async getTree(orgId: string) {
    let tree = await MerkleTree.findOne({ organizationId: orgId });

    if (!tree) {
      tree = await MerkleTree.create({
        organizationId: orgId,
        root: this.hash('GENESIS'),
        leaves: [],
      });
    }

    return tree;
  }

  async addLeaf(orgId: string, leafData: string) {
    const tree = await this.getTree(orgId);

    const leafHash = this.hash(leafData);
    tree.leaves.push({ index: tree.leaves.length, hash: leafHash });

    tree.root = this.computeRoot(tree.leaves.map(l => l.hash));
    tree.version += 1;
    tree.updatedAt = new Date();

    await tree.save();
    return tree;
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
