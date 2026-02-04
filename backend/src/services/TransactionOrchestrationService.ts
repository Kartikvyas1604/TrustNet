/**
 * Transaction Orchestration Service
 * 
 * Core service that routes transactions based on amount, destination, and privacy requirements.
 * Implements the decision tree for Yellow/Uniswap/Sui routing.
 */

import { ethers } from 'ethers';
import Employee from '../models/Employee';
import Organization from '../models/Organization';
import Transaction from '../models/Transaction';
import logger from '../utils/logger';
import { generateTransactionId, parseUSDC } from '../utils/helpers';
import { 
  TransactionType, 
  TransactionStatus, 
  PrivacyLevel,
  CreateTransactionRequest 
} from '../types';
import { TRANSACTION_LIMITS } from '../config/constants';

class TransactionOrchestrationService {
  
  /**
   * Main transaction processing entry point
   * Routes transaction based on amount, chain, and privacy requirements
   */
  async processTransaction(request: CreateTransactionRequest): Promise<any> {
    try {
      logger.info('Processing transaction request:', request);
      
      // 1. Validate and resolve sender
      const sender = await Employee.findOne({ employeeId: request.fromEmployeeId });
      if (!sender || sender.status !== 'active') {
        throw new Error('Invalid sender employee');
      }
      
      // 2. Resolve recipient (can be employeeId, address, or ENS name)
      const recipient = await this.resolveRecipient(request);
      if (!recipient) {
        throw new Error('Invalid recipient');
      }
      
      // 3. Validate they're in the same organization
      if (sender.organizationId !== recipient.organizationId) {
        throw new Error('Cross-organization transactions not yet supported');
      }
      
      // 4. Validate amount
      const amount = parseFloat(request.amount);
      if (amount <= 0 || amount > parseFloat(TRANSACTION_LIMITS.MAX_TRANSACTION_AMOUNT)) {
        throw new Error(`Invalid amount. Must be between 0 and ${TRANSACTION_LIMITS.MAX_TRANSACTION_AMOUNT}`);
      }
      
      // 5. Determine transaction route based on amount and requirements
      const transactionType = this.determineTransactionType(
        amount,
        request.chain,
        request.privacyLevel
      );
      
      // 6. Create transaction record
      const transactionId = generateTransactionId();
      const transaction = new Transaction({
        transactionId,
        organizationId: sender.organizationId,
        fromEmployeeId: sender.employeeId,
        toEmployeeId: recipient.employeeId,
        amount: request.amount,
        currency: request.currency || 'USDC',
        chain: request.chain || 'ethereum',
        transactionType,
        privacyLevel: request.privacyLevel || PrivacyLevel.ORGANIZATION_ONLY,
        status: TransactionStatus.PENDING,
        timestamp: new Date(),
        metadata: {
          memo: request.memo
        }
      });
      
      await transaction.save();
      
      // 7. Route to appropriate handler
      let result;
      switch (transactionType) {
        case TransactionType.YELLOW_OFFCHAIN:
          result = await this.processYellowOffChain(transaction, sender, recipient);
          break;
          
        case TransactionType.SUI_DIRECT:
          result = await this.processSuiDirect(transaction, sender, recipient);
          break;
          
        case TransactionType.UNISWAP_PRIVACY:
          result = await this.processUniswapPrivacy(transaction, sender, recipient);
          break;
          
        default:
          throw new Error('Unsupported transaction type');
      }
      
      // 8. Update transaction status
      transaction.status = TransactionStatus.CONFIRMED;
      transaction.blockchainTxHash = result.txHash;
      await transaction.save();
      
      logger.info(`Transaction ${transactionId} completed successfully`);
      
      return {
        transactionId,
        status: 'confirmed',
        type: transactionType,
        txHash: result.txHash,
        timestamp: transaction.timestamp
      };
      
    } catch (error) {
      logger.error('Transaction processing failed:', error);
      throw error;
    }
  }
  
  /**
   * Determines the transaction route based on amount and requirements
   */
  private determineTransactionType(
    amount: number,
    chain?: string,
    privacyLevel?: PrivacyLevel
  ): TransactionType {
    // Decision tree logic
    
    // 1. Small amounts with standard privacy → Yellow Off-Chain
    if (amount <= parseFloat(TRANSACTION_LIMITS.YELLOW_OFFCHAIN_MAX_AMOUNT) && 
        privacyLevel !== PrivacyLevel.FULLY_PRIVATE) {
      return TransactionType.YELLOW_OFFCHAIN;
    }
    
    // 2. Requires full privacy → Uniswap Privacy Pool
    if (privacyLevel === PrivacyLevel.FULLY_PRIVATE) {
      return TransactionType.UNISWAP_PRIVACY;
    }
    
    // 3. Large amounts or on Sui → Sui Direct
    if (chain === 'sui' || amount > parseFloat(TRANSACTION_LIMITS.YELLOW_OFFCHAIN_MAX_AMOUNT)) {
      return TransactionType.SUI_DIRECT;
    }
    
    // Default: Sui Direct for safety
    return TransactionType.SUI_DIRECT;
  }
  
  /**
   * Process transaction via Yellow Network off-chain state channel
   */
  private async processYellowOffChain(
    transaction: any,
    sender: any,
    recipient: any
  ): Promise<{ txHash: string }> {
    logger.info(`Processing Yellow off-chain transaction: ${transaction.transactionId}`);
    
    // TODO: Integrate with Yellow Network SDK
    // 1. Load sender's state channel
    // 2. Load recipient's state channel  
    // 3. Update channel states (debit sender, credit recipient)
    // 4. Sign state updates
    // 5. Broadcast to Yellow Network nodes
    
    // Simulated for 50% implementation
    const mockTxHash = `yellow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info(`Yellow transaction confirmed: ${mockTxHash}`);
    
    // In production, this would update channel balances in MongoDB and Redis
    // and emit WebSocket events to both parties
    
    return { txHash: mockTxHash };
  }
  
  /**
   * Process direct transaction on Sui blockchain
   */
  private async processSuiDirect(
    transaction: any,
    sender: any,
    recipient: any
  ): Promise<{ txHash: string }> {
    logger.info(`Processing Sui direct transaction: ${transaction.transactionId}`);
    
    // TODO: Integrate with Sui TypeScript SDK
    // 1. Create Programmable Transaction Block (PTB)
    // 2. Add transfer command from sender's wallet object to recipient's wallet object
    // 3. Sign with sender's key
    // 4. Submit to Sui network
    // 5. Wait for confirmation (2-3 seconds typically)
    
    // Simulated for 50% implementation
    const mockTxHash = ethers.hexlify(ethers.randomBytes(32));
    
    logger.info(`Sui transaction confirmed: ${mockTxHash}`);
    
    return { txHash: mockTxHash };
  }
  
  /**
   * Process private swap via Uniswap v4 Privacy Hook
   */
  private async processUniswapPrivacy(
    transaction: any,
    sender: any,
    recipient: any
  ): Promise<{ txHash: string }> {
    logger.info(`Processing Uniswap privacy transaction: ${transaction.transactionId}`);
    
    // TODO: Full ZK proof generation and Uniswap v4 integration
    // 1. Generate ZK-SNARK proof of organization membership
    // 2. Create commitment hash for transaction amount
    // 3. Call PrivacyPoolHook.swapWithPrivacy()
    // 4. Wait for on-chain confirmation
    // 5. Store encrypted transaction details
    
    // Simulated for 50% implementation
    const mockTxHash = ethers.hexlify(ethers.randomBytes(32));
    
    logger.info(`Uniswap privacy transaction confirmed: ${mockTxHash}`);
    
    return { txHash: mockTxHash };
  }
  
  /**
   * Resolves recipient from various input formats
   */
  private async resolveRecipient(request: CreateTransactionRequest): Promise<any> {
    // Try by employee ID
    if (request.toEmployeeId) {
      return await Employee.findOne({ employeeId: request.toEmployeeId });
    }
    
    // Try by ENS name
    if (request.toEnsName) {
      return await Employee.findOne({ ensName: request.toEnsName });
    }
    
    // Try by wallet address
    if (request.toAddress) {
      const chain = request.chain || 'ethereum';
      return await Employee.findOne({ 
        [`walletAddresses.${chain}`]: request.toAddress 
      });
    }
    
    return null;
  }
  
  /**
   * Gets transaction history for an employee
   */
  async getTransactionHistory(
    employeeId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<any> {
    const skip = (page - 1) * pageSize;
    
    const transactions = await Transaction.find({
      $or: [
        { fromEmployeeId: employeeId },
        { toEmployeeId: employeeId }
      ]
    })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(pageSize)
    .lean();
    
    const total = await Transaction.countDocuments({
      $or: [
        { fromEmployeeId: employeeId },
        { toEmployeeId: employeeId }
      ]
    });
    
    return {
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: skip + transactions.length < total
      }
    };
  }
  
  /**
   * Gets transaction by ID
   */
  async getTransaction(transactionId: string): Promise<any> {
    const transaction = await Transaction.findOne({ transactionId }).lean();
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    return transaction;
  }
  
  /**
   * Gets organization transaction statistics
   */
  async getOrganizationStats(organizationId: string): Promise<any> {
    const totalTransactions = await Transaction.countDocuments({ organizationId });
    
    const totalVolume = await Transaction.aggregate([
      { $match: { organizationId, status: TransactionStatus.CONFIRMED } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
    ]);
    
    const transactionsByType = await Transaction.aggregate([
      { $match: { organizationId } },
      { $group: { _id: '$transactionType', count: { $sum: 1 } } }
    ]);
    
    return {
      totalTransactions,
      totalVolume: totalVolume[0]?.total || 0,
      transactionsByType
    };
  }
}

export default new TransactionOrchestrationService();
