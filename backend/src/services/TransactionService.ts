import crypto from 'crypto';
import Transaction, { ITransaction } from '../models/Transaction';
import Employee from '../models/Employee';
import Organization from '../models/Organization';
import { prisma } from '../config/database';

// Encryption utility functions
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

function encrypt(data: any): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData: string): any {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

interface SendTransactionInput {
  fromEmployeeId: string;
  toEmployeeId: string;
  amount: number;
  currency: string;
  chain: string;
  transactionType?: 'yellow_offchain' | 'uniswap_privacy' | 'sui_direct' | 'standard';
  privacyLevel?: 'public' | 'organization-only' | 'fully-private';
  memo?: string;
}

class TransactionService {
  /**
   * Send transaction between employees
   */
  async sendTransaction(input: SendTransactionInput): Promise<ITransaction> {
  // Validate sender
  const fromEmployee = await Employee.findOne({ employeeId: input.fromEmployeeId });
  if (!fromEmployee || fromEmployee.status !== 'ACTIVE') {
    throw new Error('Sender employee not found or inactive');
  }

  // Validate receiver
  const toEmployee = await Employee.findOne({ employeeId: input.toEmployeeId });
  if (!toEmployee || toEmployee.status !== 'ACTIVE') {
    throw new Error('Receiver employee not found or inactive');
  }

  // Verify both employees are in same organization
  if (fromEmployee.organizationId !== toEmployee.organizationId) {
    throw new Error('Cross-organization transactions not supported in this version');
  }

  // Verify amount is positive
  if (input.amount <= 0) {
    throw new Error('Transaction amount must be positive');
  }

  // Generate transaction ID
  const transactionId = `tx_${crypto.randomBytes(16).toString('hex')}`;

  // 🔐 Encrypt sensitive transaction data
  const encryptedPayload = encrypt({
    fromEmployeeId: input.fromEmployeeId,
    toEmployeeId: input.toEmployeeId,
    amount: input.amount,
    memo: input.memo,
  });

  // 🧾 Create transaction record (NO PLAINTEXT DATA)
  const transaction = await prisma.transaction.create({
    data: {
      transactionId,
      organizationId: fromEmployee.organizationId,
      fromEmployeeId: input.fromEmployeeId,
      toEmployeeId: input.toEmployeeId,
      amount: input.amount.toString(),
      encryptedDetails: encryptedPayload, // ✅ encrypted internal data
      currency: input.currency || 'USDC',
      chain: input.chain,
      transactionType: (input.transactionType || 'STANDARD').toUpperCase().replace(/-/g, '_') as any,
      privacyLevel: (input.privacyLevel || 'ORGANIZATION_ONLY').toUpperCase().replace(/-/g, '_') as any,
      status: 'PENDING',
      timestamp: new Date(),
    },
  }) as any;

  // Simulate instant confirmation for off-chain transactions
  if (input.transactionType && input.transactionType.toUpperCase().replace(/-/g, '_') === 'YELLOW_OFFCHAIN') {
    setTimeout(async () => {
      await this.confirmTransaction(transactionId, 'offchain_instant');
    }, 100);
  }

  console.log(
    `Private transaction created: ${transactionId} (${input.currency || 'USDC'})`
  );

  return transaction;
}


  /**
   * Confirm transaction
   */
  async confirmTransaction(
    transactionId: string,
    blockchainTxHash?: string
  ): Promise<ITransaction | null> {
    const transaction = await prisma.transaction.update({
      where: { transactionId },
      data: {
        status: 'CONFIRMED',
        ...(blockchainTxHash && { blockchainTxHash }),
      },
    }) as any;

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    console.log(`Transaction confirmed: ${transactionId}`);
    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<ITransaction | null> {
    return await Transaction.findOne({ transactionId });
  }

  /**
   * Get employee transactions (sent and received)
   */
  async getEmployeeTransactions(employeeId: string, limit: number = 50): Promise<ITransaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: {},
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    // Filter in memory for encrypted fields
    return transactions.filter((tx: any) => {
      try {
        const decrypted = decrypt(tx.encryptedPayload);
        return decrypted.fromEmployeeId === employeeId || decrypted.toEmployeeId === employeeId;
      } catch {
        return false;
      }
    }) as any;
  }

  /**
   * Get organization transactions
   */
  async getOrganizationTransactions(
    organizationId: string,
    limit: number = 100
  ): Promise<ITransaction[]> {
    return await prisma.transaction.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    }) as any;
  }

  /**
   * Get transaction statistics for employee
   */
  async getEmployeeStats(employeeId: string) {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Simplified stats without aggregate
    const allTransactions = await prisma.transaction.findMany({
      where: { status: 'CONFIRMED' },
    });

    let sentTotal = 0, sentCount = 0, receivedTotal = 0, receivedCount = 0;
    allTransactions.forEach((tx: any) => {
      try {
        const decrypted = decrypt(tx.encryptedPayload);
        if (decrypted.fromEmployeeId === employeeId) {
          sentTotal += Number(decrypted.amount || 0);
          sentCount++;
        }
        if (decrypted.toEmployeeId === employeeId) {
          receivedTotal += Number(decrypted.amount || 0);
          receivedCount++;
        }
      } catch {}
    });

    return {
      sent: {
        totalAmount: sentTotal,
        count: sentCount,
      },
      received: {
        totalAmount: receivedTotal,
        count: receivedCount,
      },
      netBalance: receivedTotal - sentTotal,
    };
  }

  /**
   * Get organization transaction statistics
   */
  async getOrganizationStats(organizationId: string) {
    const organization = await Organization.findOne({ organizationId });
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Simplified stats
    const confirmedTxs = await prisma.transaction.findMany({
      where: { organizationId, status: 'CONFIRMED' },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    let totalVolume = 0, totalCount = 0;
    const typeStats: any = {};
    
    confirmedTxs.forEach((tx: any) => {
      totalCount++;
      try {
        const decrypted = decrypt(tx.encryptedPayload);
        const amount = Number(decrypted.amount || 0);
        totalVolume += amount;
        const type = tx.transactionType || 'unknown';
        if (!typeStats[type]) typeStats[type] = { count: 0, volume: 0 };
        typeStats[type].count++;
        typeStats[type].volume += amount;
      } catch {}
    });

    const recent = confirmedTxs.slice(0, 10);

    return {
      overview: {
        totalVolume,
        totalTransactions: totalCount,
        avgTransactionSize: totalCount > 0 ? totalVolume / totalCount : 0,
      },
      byType: Object.entries(typeStats).map(([type, data]: [string, any]) => ({
        _id: type,
        count: data.count,
        volume: data.volume,
      })),
      recentTransactions: recent,
    };
  }

  /**
   * Mark transaction as failed
   */
  async failTransaction(transactionId: string, reason?: string): Promise<ITransaction | null> {
    const transaction = await prisma.transaction.update({
      where: { transactionId },
      data: {
        status: 'FAILED',
        metadata: reason ? { failureReason: reason } as any : undefined,
      },
    }) as any;

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    console.log(`Transaction failed: ${transactionId} - ${reason}`);
    return transaction;
  }

  /**
   * Get pending transactions for employee
   */
  async getPendingTransactions(employeeId: string): Promise<ITransaction[]> {
    const allTxs = await prisma.transaction.findMany({
      where: { status: 'PENDING' },
      orderBy: { timestamp: 'desc' },
    });
    // Filter in memory for encrypted fields
    return allTxs.filter((tx: any) => {
      try {
        const decrypted = decrypt(tx.encryptedPayload);
        return decrypted.fromEmployeeId === employeeId || decrypted.toEmployeeId === employeeId;
      } catch {
        return false;
      }
    }) as any;
  }
}

export default new TransactionService();
