import crypto from 'crypto';
import MerkleTreeService from './MerkleTreeService';

class ZKProofService {
  generateCommitment(value: number, salt?: string) {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const commitment = crypto
      .createHash('sha256')
      .update(value.toString() + s)
      .digest('hex');

    return { commitment, salt: s };
  }

  async generateMembershipProof(
    organizationId: string,
    employeeSecret: string
  ) {
    const tree = await MerkleTreeService.getTree(organizationId);
    const leafHash = crypto
      .createHash('sha256')
      .update(employeeSecret)
      .digest('hex');

    const leafIndex = tree.leaves.find(l => l.hash === leafHash)?.index;
    if (leafIndex === undefined) {
      throw new Error('Employee not part of Merkle tree');
    }

    // Placeholder for real circom proof
    return {
      proof: `zk-proof-${leafIndex}`,
      publicSignals: {
        root: tree.root,
        index: leafIndex,
      },
    };
  }
}

export default new ZKProofService();
