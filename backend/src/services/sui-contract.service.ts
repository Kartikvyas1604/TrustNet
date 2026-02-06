import { JsonRpcProvider, TransactionBlock, Ed25519Keypair } from '@mysten/sui.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sui network configuration
const SUI_NETWORK = process.env.SUI_NETWORK || 'testnet'
const SUI_RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443'

// Contract addresses (from deployment)
const PRIVACY_POOL_ADDRESS = process.env.PRIVACY_POOL_ADDRESS || '0x...'
const ORGANIZATION_REGISTRY_ADDRESS = process.env.ORGANIZATION_REGISTRY_ADDRESS || '0x...'
const EMPLOYEE_WALLET_ADDRESS = process.env.EMPLOYEE_WALLET_ADDRESS || '0x...'
const PAYROLL_DISTRIBUTOR_ADDRESS = process.env.PAYROLL_DISTRIBUTOR_ADDRESS || '0x...'

export class SuiContractService {
  private provider: JsonRpcProvider
  private adminKeypair: Ed25519Keypair | null = null

  constructor() {
    this.provider = new JsonRpcProvider(SUI_RPC_URL)
    this.initializeAdminKeypair()
  }

  private initializeAdminKeypair() {
    const privateKey = process.env.SUI_ADMIN_PRIVATE_KEY
    if (privateKey) {
      this.adminKeypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'hex'))
    }
  }

  // Register organization on-chain
  async registerOrganization(organizationId: string, adminAddress: string, name: string) {
    try {
      const tx = new TransactionBlock()
      
      tx.moveCall({
        target: `${ORGANIZATION_REGISTRY_ADDRESS}::organization_registry::register_organization`,
        arguments: [
          tx.pure(organizationId),
          tx.pure(adminAddress),
          tx.pure(name),
        ],
      })

      if (!this.adminKeypair) {
        throw new Error('Admin keypair not initialized')
      }

      const result = await this.provider.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.adminKeypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      })

      return {
        success: true,
        txHash: result.digest,
        effects: result.effects,
      }
    } catch (error: any) {
      console.error('Organization registration on-chain failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Create employee wallet on-chain
  async createEmployeeWallet(employeeId: string, organizationId: string, walletAddress: string) {
    try {
      const tx = new TransactionBlock()
      
      tx.moveCall({
        target: `${EMPLOYEE_WALLET_ADDRESS}::employee_wallet::create_wallet`,
        arguments: [
          tx.pure(employeeId),
          tx.pure(organizationId),
          tx.pure(walletAddress),
        ],
      })

      if (!this.adminKeypair) {
        throw new Error('Admin keypair not initialized')
      }

      const result = await this.provider.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.adminKeypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      })

      return {
        success: true,
        txHash: result.digest,
        walletObjectId: this.extractWalletObjectId(result),
      }
    } catch (error: any) {
      console.error('Employee wallet creation failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Execute external transaction on-chain
  async executeExternalTransaction(
    transactionId: string,
    fromAddress: string,
    toAddress: string,
    amount: number,
    token: string
  ) {
    try {
      const tx = new TransactionBlock()
      
      // Get coin objects for the amount
      const coinType = this.getCoinType(token)
      
      tx.moveCall({
        target: `${PRIVACY_POOL_ADDRESS}::privacy_pool::execute_transaction`,
        arguments: [
          tx.pure(transactionId),
          tx.pure(fromAddress),
          tx.pure(toAddress),
          tx.pure(amount),
        ],
        typeArguments: [coinType],
      })

      if (!this.adminKeypair) {
        throw new Error('Admin keypair not initialized')
      }

      const result = await this.provider.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.adminKeypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      })

      return {
        success: true,
        txHash: result.digest,
        effects: result.effects,
      }
    } catch (error: any) {
      console.error('External transaction execution failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Execute payroll batch on-chain
  async executePayrollBatch(
    organizationId: string,
    payments: Array<{ employeeId: string; amount: number; walletAddress: string }>
  ) {
    try {
      const tx = new TransactionBlock()
      
      const employeeIds = payments.map(p => p.employeeId)
      const amounts = payments.map(p => p.amount)
      const addresses = payments.map(p => p.walletAddress)

      tx.moveCall({
        target: `${PAYROLL_DISTRIBUTOR_ADDRESS}::payroll_distributor::distribute_payroll`,
        arguments: [
          tx.pure(organizationId),
          tx.pure(employeeIds),
          tx.pure(amounts),
          tx.pure(addresses),
        ],
      })

      if (!this.adminKeypair) {
        throw new Error('Admin keypair not initialized')
      }

      const result = await this.provider.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.adminKeypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      })

      return {
        success: true,
        txHash: result.digest,
        effects: result.effects,
      }
    } catch (error: any) {
      console.error('Payroll execution failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Get balance for address
  async getBalance(address: string, token: string = 'SUI'): Promise<number> {
    try {
      const coinType = this.getCoinType(token)
      const balance = await this.provider.getBalance({
        owner: address,
        coinType,
      })

      return parseInt(balance.totalBalance) / 1e9 // Convert from smallest unit
    } catch (error: any) {
      console.error('Failed to get balance:', error)
      return 0
    }
  }

  // Get transaction status
  async getTransactionStatus(txHash: string) {
    try {
      const tx = await this.provider.getTransactionBlock({
        digest: txHash,
        options: {
          showEffects: true,
          showEvents: true,
        },
      })

      return {
        success: true,
        status: tx.effects?.status?.status || 'unknown',
        events: tx.events,
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Helper: Get coin type for token
  private getCoinType(token: string): string {
    const coinTypes: Record<string, string> = {
      SUI: '0x2::sui::SUI',
      USDC: '0x...::usdc::USDC', // Replace with actual USDC address
      ETH: '0x...::eth::ETH',     // Replace with actual ETH address
    }
    return coinTypes[token] || coinTypes.SUI
  }

  // Helper: Extract wallet object ID from transaction result
  private extractWalletObjectId(result: any): string | null {
    try {
      const created = result.objectChanges?.filter((change: any) => change.type === 'created')
      return created?.[0]?.objectId || null
    } catch {
      return null
    }
  }

  // Verify proof on-chain (ZK proof verification)
  async verifyProof(proof: any, publicInputs: any): Promise<boolean> {
    try {
      const tx = new TransactionBlock()
      
      tx.moveCall({
        target: `${PRIVACY_POOL_ADDRESS}::privacy_pool::verify_proof`,
        arguments: [
          tx.pure(JSON.stringify(proof)),
          tx.pure(JSON.stringify(publicInputs)),
        ],
      })

      if (!this.adminKeypair) {
        throw new Error('Admin keypair not initialized')
      }

      const result = await this.provider.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.adminKeypair,
        options: {
          showEffects: true,
        },
      })

      return result.effects?.status?.status === 'success'
    } catch (error: any) {
      console.error('Proof verification failed:', error)
      return false
    }
  }
}

// Singleton instance
let suiContractService: SuiContractService | null = null

export function getSuiContractService(): SuiContractService {
  if (!suiContractService) {
    suiContractService = new SuiContractService()
  }
  return suiContractService
}
