// Use @ts-ignore for @mysten/sui imports until proper ESM setup
// @ts-ignore - @mysten/sui uses ESM exports which require bundler moduleResolution
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
// @ts-ignore
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
// @ts-ignore
import { Transaction } from '@mysten/sui/transactions';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';
import redisService from './RedisService';

class ProductionSuiBlockchainService extends EventEmitter {
  private client: SuiClient;
  private keypair: Ed25519Keypair | null = null;
  private readonly network: 'mainnet' | 'testnet' | 'devnet';
  
  // Deployed contract package IDs (loaded from deployment file)
  private packageId: string;
  private organizationRegistryId: string;
  private privacyPoolId: string;
  private payrollDistributorId: string;
  
  // USDC contract on Sui
  private readonly USDC_PACKAGE_ID: string;
  private readonly USDC_COIN_TYPE: string;

  constructor() {
    super();
    
    // Determine network
    this.network = (process.env.SUI_NETWORK as any) || 'testnet';
    
    // Initialize Sui client
    this.client = new SuiClient({ url: getFullnodeUrl(this.network) });
    
    // Load deployment info
    const deploymentInfo = this.loadDeploymentInfo();
    this.packageId = deploymentInfo.packageId;
    this.organizationRegistryId = deploymentInfo.organizationRegistryId;
    this.privacyPoolId = deploymentInfo.privacyPoolId;
    this.payrollDistributorId = deploymentInfo.payrollDistributorId;
    
    // USDC configuration (Native USDC on Sui)
    this.USDC_PACKAGE_ID = process.env.USDC_PACKAGE_ID || '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf';
    this.USDC_COIN_TYPE = `${this.USDC_PACKAGE_ID}::usdc::USDC`;
    
    // Initialize keypair if private key is provided
    if (process.env.SUI_PRIVATE_KEY) {
      try {
        const privateKeyBytes = Buffer.from(process.env.SUI_PRIVATE_KEY.replace('0x', ''), 'hex');
        this.keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
        logger.info('Sui keypair initialized', { 
          address: this.keypair.getPublicKey().toSuiAddress() 
        });
      } catch (error) {
        logger.error('Failed to initialize Sui keypair', { error });
      }
    }
    
    logger.info('Production Sui Blockchain Service initialized', {
      network: this.network,
      packageId: this.packageId,
      organizationRegistryId: this.organizationRegistryId,
    });
  }

  /**
   * Load deployed contract addresses from deployment file
   */
  private loadDeploymentInfo(): any {
    try {
      const deploymentFile = path.join(
        __dirname,
        '../../deployments',
        `sui-contracts-${this.network}.json`
      );
      
      if (!fs.existsSync(deploymentFile)) {
        logger.warn('Sui deployment file not found, using environment variables', {
          file: deploymentFile
        });
        
        return {
          packageId: process.env.SUI_PACKAGE_ID || '',
          organizationRegistryId: process.env.SUI_ORG_REGISTRY_ID || '',
          privacyPoolId: process.env.SUI_PRIVACY_POOL_ID || '',
          payrollDistributorId: process.env.SUI_PAYROLL_DISTRIBUTOR_ID || '',
        };
      }
      
      const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
      logger.info('Loaded Sui deployment info', { deployment });
      
      return {
        packageId: deployment.packageId,
        organizationRegistryId: deployment.organizationRegistry,
        privacyPoolId: deployment.privacyPool,
        payrollDistributorId: deployment.payrollDistributor,
      };
    } catch (error) {
      logger.error('Failed to load Sui deployment info', { error });
      throw new Error('SUI_PACKAGE_ID must be set in environment or deployments file');
    }
  }
  async createUSDCTransfer(
    sender: string,
    recipient: string,
    amount: number,
    senderKeypair?: Ed25519Keypair
  ): Promise<string> {
    try {
      const keypair = senderKeypair || this.keypair;
      if (!keypair) {
        throw new Error('No keypair available for signing transaction');
      }

      // Convert amount to USDC units (6 decimals)
      const amountInUnits = BigInt(Math.floor(amount * 1_000_000));

      // Create transaction
      const tx = new Transaction();
      
      // Get USDC coins from sender
      const [coin] = tx.splitCoins(tx.gas, [amountInUnits]);
      
      // Transfer to recipient
      tx.transferObjects([coin], recipient);
      
      // Set sender
      tx.setSender(sender);

      // Execute transaction
      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      const digest = result.digest;
      
      logger.info('USDC transfer executed', {
        digest,
        sender,
        recipient,
        amount,
        status: result.effects?.status?.status,
      });

      // Cache transaction
      await redisService.set(
        `sui:tx:${digest}`,
        JSON.stringify({
          digest,
          sender,
          recipient,
          amount,
          timestamp: Date.now(),
          status: result.effects?.status?.status,
        }),
        3600
      );

      // Emit event
      this.emit('transaction:created', {
        digest,
        sender,
        recipient,
        amount,
        timestamp: Date.now(),
      });

      return digest;
    } catch (error: any) {
      logger.error('Failed to create USDC transfer', { 
        sender, 
        recipient, 
        amount, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get USDC balance for an address
   * 
   * @param address - Sui address
   * @returns Balance in USDC
   */
  async getUSDCBalance(address: string): Promise<number> {
    try {
      // Check cache first
      const cacheKey = `sui:balance:${address}`;
      const cached = await redisService.get(cacheKey);
      
      if (cached) {
        return parseFloat(cached);
      }

      // Query balance from blockchain
      const balance = await this.client.getBalance({
        owner: address,
        coinType: this.USDC_COIN_TYPE,
      });

      const balanceInUSDC = Number(balance.totalBalance) / 1_000_000;
      
      // Cache for 30 seconds
      await redisService.set(cacheKey, balanceInUSDC.toString(), 30);

      logger.info('USDC balance queried', { address, balance: balanceInUSDC });

      return balanceInUSDC;
    } catch (error: any) {
      logger.error('Failed to get USDC balance', { address, error: error.message });
      return 0;
    }
  }

  /**
   * Register organization in Sui registry
   * 
   * @param organizationId - Organization identifier
   * @param merkleRoot - Employee Merkle tree root
   * @param admin - Admin address
   * @param adminKeypair - Admin's keypair
   * @returns Transaction digest
   */
  async registerOrganization(
    organizationId: string,
    merkleRoot: string,
    admin: string,
    adminKeypair?: Ed25519Keypair
  ): Promise<string> {
    try {
      const keypair = adminKeypair || this.keypair;
      if (!keypair) {
        throw new Error('No keypair available for signing transaction');
      }

      const tx = new Transaction();
      
      // Call organization_registry::register_organization
      tx.moveCall({
        target: `${this.packageId}::organization_registry_clean::register_organization`,
        arguments: [
          tx.object(this.organizationRegistryId),
          tx.pure.string(organizationId),
          tx.pure.vector('u8', Array.from(Buffer.from(merkleRoot.replace('0x', ''), 'hex'))),
        ],
      });
      
      tx.setSender(admin);

      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      logger.info('Organization registered on Sui', {
        digest: result.digest,
        organizationId,
        admin,
      });

      return result.digest;
    } catch (error: any) {
      logger.error('Failed to register organization', { 
        organizationId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update organization Merkle root
   * 
   * @param organizationId - Organization identifier
   * @param newMerkleRoot - New Merkle tree root
   * @param admin - Admin address
   * @param adminKeypair - Admin's keypair
   * @returns Transaction digest
   */
  async updateMerkleRoot(
    organizationId: string,
    newMerkleRoot: string,
    admin: string,
    adminKeypair?: Ed25519Keypair
  ): Promise<string> {
    try {
      const keypair = adminKeypair || this.keypair;
      if (!keypair) {
        throw new Error('No keypair available for signing transaction');
      }

      const tx = new Transaction();
      
      // Call organization_registry::update_merkle_root
      tx.moveCall({
        target: `${this.packageId}::organization_registry_clean::update_merkle_root`,
        arguments: [
          tx.object(this.organizationRegistryId),
          tx.pure.string(organizationId),
          tx.pure.vector('u8', Array.from(Buffer.from(newMerkleRoot.replace('0x', ''), 'hex'))),
        ],
      });
      
      tx.setSender(admin);

      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
        },
      });

      logger.info('Organization Merkle root updated', {
        digest: result.digest,
        organizationId,
        newMerkleRoot,
      });

      return result.digest;
    } catch (error: any) {
      logger.error('Failed to update Merkle root', { 
        organizationId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Execute batch payroll distribution
   * 
   * @param organizationId - Organization identifier
   * @param recipients - Array of recipient addresses
   * @param amounts - Array of amounts (in USDC)
   * @param sponsor - Sponsor address (for gas)
   * @param sponsorKeypair - Sponsor's keypair
   * @returns Transaction digest
   */
  async distributeBatchPayroll(
    organizationId: string,
    recipients: string[],
    amounts: number[],
    sponsor: string,
    sponsorKeypair?: Ed25519Keypair
  ): Promise<string> {
    try {
      if (recipients.length !== amounts.length) {
        throw new Error('Recipients and amounts arrays must have the same length');
      }

      const keypair = sponsorKeypair || this.keypair;
      if (!keypair) {
        throw new Error('No keypair available for signing transaction');
      }

      const tx = new Transaction();
      
      // Convert amounts to USDC units
      const amountsInUnits = amounts.map(amt => BigInt(Math.floor(amt * 1_000_000)));

      // Call payroll_distributor::distribute_batch
      tx.moveCall({
        target: `${this.packageId}::payroll_distributor::distribute_batch`,
        arguments: [
          tx.object(this.payrollDistributorId),
          tx.pure.string(organizationId),
          tx.pure.vector('address', recipients),
          tx.pure.vector('u64', amountsInUnits),
        ],
        typeArguments: [this.USDC_COIN_TYPE],
      });
      
      tx.setSender(sponsor);

      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      logger.info('Batch payroll distributed', {
        digest: result.digest,
        organizationId,
        recipientCount: recipients.length,
        totalAmount: amounts.reduce((sum, amt) => sum + amt, 0),
      });

      return result.digest;
    } catch (error: any) {
      logger.error('Failed to distribute batch payroll', { 
        organizationId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get transaction details
   * 
   * @param digest - Transaction digest
   * @returns Transaction details
   */
  async getTransaction(digest: string): Promise<any> {
    try {
      // Check cache first
      const cacheKey = `sui:tx:${digest}`;
      const cached = await redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Query from blockchain
      const tx = await this.client.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true,
          showObjectChanges: true,
        },
      });

      // Cache for 1 hour
      await redisService.set(cacheKey, JSON.stringify(tx), 3600);

      return tx;
    } catch (error: any) {
      logger.error('Failed to get transaction', { digest, error: error.message });
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   * 
   * @param digest - Transaction digest
   * @param timeoutMs - Timeout in milliseconds
   * @returns True if confirmed, false if timeout
   */
  async waitForTransaction(digest: string, timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const tx = await this.getTransaction(digest);
        
        if (tx.effects?.status?.status === 'success') {
          logger.info('Transaction confirmed', { digest });
          return true;
        } else if (tx.effects?.status?.status === 'failure') {
          logger.error('Transaction failed', { 
            digest, 
            error: tx.effects?.status?.error 
          });
          return false;
        }
      } catch (error) {
        // Transaction not found yet, continue waiting
      }
      
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.warn('Transaction confirmation timeout', { digest });
    return false;
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const gasPrice = await this.client.getReferenceGasPrice();
      return BigInt(gasPrice);
    } catch (error: any) {
      logger.error('Failed to get gas price', { error: error.message });
      return BigInt(1000); // Default fallback
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo(): { network: string; packageId: string; rpcUrl: string } {
    return {
      network: this.network,
      packageId: this.packageId,
      rpcUrl: getFullnodeUrl(this.network),
    };
  }
}

// Export singleton instance
export default new ProductionSuiBlockchainService();
