// @ts-ignore - snarkjs doesn't have official TypeScript definitions
import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import MerkleTreeService from './MerkleTreeService';
import logger from '../utils/logger';
import { ethers } from 'ethers';

interface ProofData {
  proof: any;
  publicSignals: string[];
}

interface CommitmentData {
  commitment: string;
  salt: string;
}

interface Groth16Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

/**
 * PRODUCTION Zero-Knowledge Proof Service
 * Uses real snarkjs for ZK proof generation
 * 
 * This service generates real Groth16 proofs for:
 * 1. Membership proofs (employee belongs to organization)
 * 2. Amount commitments (hiding transaction amounts)
 */
class ProductionZKProofService {
  private readonly CIRCUITS_PATH = path.join(__dirname, '../../circuits');
  private readonly KEYS_PATH = path.join(this.CIRCUITS_PATH, 'keys');
  
  // Circuit files
  private readonly MEMBERSHIP_WASM = path.join(this.CIRCUITS_PATH, 'build/transaction_membership/transaction_membership_js/transaction_membership.wasm');
  private readonly MEMBERSHIP_ZKEY = path.join(this.KEYS_PATH, 'transaction_membership/circuit_final.zkey');
  private readonly MEMBERSHIP_VKEY = path.join(this.KEYS_PATH, 'transaction_membership/verification_key.json');
  
  private readonly AMOUNT_WASM = path.join(this.CIRCUITS_PATH, 'build/amount_commitment/amount_commitment_js/amount_commitment.wasm');
  private readonly AMOUNT_ZKEY = path.join(this.KEYS_PATH, 'amount_commitment/circuit_final.zkey');
  private readonly AMOUNT_VKEY = path.join(this.KEYS_PATH, 'amount_commitment/verification_key.json');

  /**
   * Generates a commitment for hiding transaction amounts
   * commitment = hash(amount, salt)
   */
  generateCommitment(value: number, salt?: string): CommitmentData {
    try {
      const s = salt || crypto.randomBytes(32).toString('hex');
      const commitment = crypto
        .createHash('sha256')
        .update(value.toString() + s)
        .digest('hex');

      logger.debug('Generated commitment', { 
        valueLength: value.toString().length,
        saltLength: s.length,
        commitment: commitment.substring(0, 10) + '...'
      });

      return { commitment: '0x' + commitment, salt: s };
    } catch (error) {
      logger.error('Failed to generate commitment', { error });
      throw new Error('Commitment generation failed');
    }
  }

  /**
   * Verifies a commitment
   */
  verifyCommitment(value: number, salt: string, commitment: string): boolean {
    const computed = '0x' + crypto
      .createHash('sha256')
      .update(value.toString() + salt)
      .digest('hex');
    
    return computed === commitment;
  }

  /**
   * Generates a REAL membership proof using snarkjs
   * Proves an employee belongs to an organization without revealing which employee
   * 
   * @param organizationId - Organization identifier
   * @param employeeAddress - Employee's wallet address (private input)
   * @param transactionNonce - Unique nonce for this transaction
   * @returns ZK proof and public signals
   */
  async generateMembershipProof(
    organizationId: string,
    employeeAddress: string,
    transactionNonce?: number
  ): Promise<ProofData> {
    try {
      logger.info('Generating REAL ZK membership proof', { organizationId });

      // Get organization's Merkle tree
      const tree = await MerkleTreeService.getTree(organizationId);
      
      if (!tree) {
        throw new Error(`Merkle tree not found for organization: ${organizationId}`);
      }

      // Hash employee address to get leaf
      const leafHash = this.hashAddress(employeeAddress);

      // Find employee in tree
      const leaves = (tree.leaves as any) || [];
      const leaf = leaves.find((l: any) => l.hash === leafHash);
      
      if (!leaf) {
        throw new Error('Employee not found in organization Merkle tree');
      }

      const leafIndex = leaf.index;

      // Generate nullifier (prevents double-spending)
      const nonce = transactionNonce || Date.now();
      const nullifier = this.generateNullifier(employeeAddress, nonce);

      // Get Merkle proof path
      const { pathElements, pathIndices } = this.getMerklePath(tree, leafIndex);

      // Prepare circuit inputs
      const input = {
        // Private inputs
        employeeAddress: this.addressToBigInt(employeeAddress),
        merkleProofPath: pathElements.map(p => this.hexToBigInt(p)),
        merkleProofIndices: pathIndices,
        transactionNonce: nonce,
        
        // Public inputs
        merkleRoot: this.hexToBigInt(tree.treeRoot),
        nullifier: this.hexToBigInt(nullifier)
      };

      logger.debug('Circuit inputs prepared', {
        merkleRoot: input.merkleRoot.toString(),
        nullifier: input.nullifier.toString(),
        pathLength: pathElements.length
      });

      // Check if circuit files exist
      if (!fs.existsSync(this.MEMBERSHIP_WASM)) {
        throw new Error(`Circuit WASM not found: ${this.MEMBERSHIP_WASM}. Run: cd circuits && ./compile-circuits.sh`);
      }

      if (!fs.existsSync(this.MEMBERSHIP_ZKEY)) {
        throw new Error(`Circuit zkey not found: ${this.MEMBERSHIP_ZKEY}. Run: cd circuits && ./setup-keys.sh`);
      }

      // Generate the proof using snarkjs
      logger.info('Generating proof with snarkjs (this may take 1-3 seconds)...');
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        this.MEMBERSHIP_WASM,
        this.MEMBERSHIP_ZKEY
      );

      logger.info('✅ ZK proof generated successfully', {
        proofPoints: Object.keys(proof).length,
        publicSignalsCount: publicSignals.length
      });

      return {
        proof,
        publicSignals
      };

    } catch (error: any) {
      logger.error('Failed to generate membership proof', { 
        error: error.message,
        organizationId 
      });
      throw new Error(`ZK proof generation failed: ${error.message}`);
    }
  }

  /**
   * Generates a REAL amount proof using snarkjs
   * Proves knowledge of amount and salt that produce a commitment
   */
  async generateAmountProof(
    amount: number,
    salt: string,
    commitment: string
  ): Promise<ProofData> {
    try {
      logger.info('Generating REAL ZK amount proof');

      // Verify commitment is correct
      if (!this.verifyCommitment(amount, salt, commitment)) {
        throw new Error('Invalid commitment');
      }

      // Prepare circuit inputs
      const input = {
        // Private inputs
        amount: amount,
        salt: this.hexToBigInt(salt),
        
        // Public input
        commitment: this.hexToBigInt(commitment.replace('0x', ''))
      };

      // Check if circuit files exist
      if (!fs.existsSync(this.AMOUNT_WASM)) {
        throw new Error(`Circuit WASM not found: ${this.AMOUNT_WASM}. Run: cd circuits && ./compile-circuits.sh`);
      }

      if (!fs.existsSync(this.AMOUNT_ZKEY)) {
        throw new Error(`Circuit zkey not found: ${this.AMOUNT_ZKEY}. Run: cd circuits && ./setup-keys.sh`);
      }

      // Generate the proof
      logger.info('Generating amount proof with snarkjs...');
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        this.AMOUNT_WASM,
        this.AMOUNT_ZKEY
      );

      logger.info('✅ Amount proof generated successfully');

      return {
        proof,
        publicSignals
      };

    } catch (error: any) {
      logger.error('Failed to generate amount proof', { error: error.message });
      throw new Error(`Amount proof generation failed: ${error.message}`);
    }
  }

  /**
   * Verifies a membership proof
   */
  async verifyMembershipProof(
    proof: any,
    publicSignals: string[]
  ): Promise<boolean> {
    try {
      if (!fs.existsSync(this.MEMBERSHIP_VKEY)) {
        throw new Error('Verification key not found');
      }

      const vKey = JSON.parse(fs.readFileSync(this.MEMBERSHIP_VKEY, 'utf8'));
      const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      
      logger.debug('Proof verification result', { verified });
      return verified;

    } catch (error: any) {
      logger.error('Proof verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Verifies an amount proof
   */
  async verifyAmountProof(
    proof: any,
    publicSignals: string[]
  ): Promise<boolean> {
    try {
      if (!fs.existsSync(this.AMOUNT_VKEY)) {
        throw new Error('Verification key not found');
      }

      const vKey = JSON.parse(fs.readFileSync(this.AMOUNT_VKEY, 'utf8'));
      const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      
      return verified;

    } catch (error: any) {
      logger.error('Amount proof verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Formats proof for Solidity verifier contract
   */
  formatProofForContract(proof: Groth16Proof, publicSignals: string[]): {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    input: string[];
  } {
    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ],
      c: [proof.pi_c[0], proof.pi_c[1]],
      input: publicSignals
    };
  }

  /**
   * Exports proof as calldata for Solidity contract
   */
  async exportSolidityCallData(proof: any, publicSignals: string[]): Promise<string> {
    return await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private hashAddress(address: string): string {
    return crypto
      .createHash('sha256')
      .update(address.toLowerCase())
      .digest('hex');
  }

  private generateNullifier(address: string, nonce: number): string {
    return crypto
      .createHash('sha256')
      .update(address.toLowerCase() + nonce.toString())
      .digest('hex');
  }

  private addressToBigInt(address: string): string {
    const hash = this.hashAddress(address);
    return BigInt('0x' + hash).toString();
  }

  private hexToBigInt(hex: string): string {
    const cleaned = hex.replace('0x', '');
    return BigInt('0x' + cleaned).toString();
  }

  private getMerklePath(tree: any, leafIndex: number): {
    pathElements: string[];
    pathIndices: number[];
  } {
    const leaves = tree.leaves || [];
    const pathElements: string[] = [];
    const pathIndices: number[] = [];
    
    let currentIndex = leafIndex;
    const height = Math.ceil(Math.log2(leaves.length));
    
    for (let i = 0; i < height; i++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      pathIndices.push(currentIndex % 2);
      
      if (siblingIndex < leaves.length) {
        pathElements.push(leaves[siblingIndex].hash);
      } else {
        // Use zero hash for missing siblings
        pathElements.push('0x' + '0'.repeat(64));
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return { pathElements, pathIndices };
  }
}

export default new ProductionZKProofService();
