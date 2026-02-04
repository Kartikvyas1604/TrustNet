import { EventEmitter } from 'events';
import redisService from './RedisService';
import logger from '../utils/logger';
import { generateChannelId } from '../utils/helpers';
import { ChannelStatus } from '../types';

interface ChannelState {
  channelId: string;
  employeeId: string;
  organizationId: string;
  balance: string;
  nonce: number;
  status: ChannelStatus;
  openedAt: Date;
  lastUpdatedAt: Date;
}

class YellowNetworkService extends EventEmitter {
  private channels: Map<string, ChannelState>;
  
  constructor() {
    super();
    this.channels = new Map();
  }
  
  /**
   * Opens a new state channel for an employee
   */
  async openChannel(
    employeeId: string,
    organizationId: string,
    initialDeposit: string = '100.00'
  ): Promise<string> {
    try {
      const channelId = generateChannelId();
      
      const channelState: ChannelState = {
        channelId,
        employeeId,
        organizationId,
        balance: initialDeposit,
        nonce: 0,
        status: ChannelStatus.OPEN,
        openedAt: new Date(),
        lastUpdatedAt: new Date()
      };
      
      // Store in memory (would be Redis in production)
      this.channels.set(channelId, channelState);
      
      // Cache in Redis with 24h TTL
      await redisService.setWithExpiry(
        `channel:${channelId}`,
        JSON.stringify(channelState),
        86400 // 24 hours
      );
      
      logger.info(`Channel opened: ${channelId} for employee: ${employeeId}`);
      
      // Emit event
      this.emit('channel:opened', { channelId, employeeId });
      
      return channelId;
      
    } catch (error) {
      logger.error('Failed to open channel:', error);
      throw new Error('Failed to open state channel');
    }
  }
  
  /**
   * Processes an off-chain payment between two employees
   */
  async processOffChainPayment(
    senderChannelId: string,
    recipientChannelId: string,
    amount: string
  ): Promise<{ success: boolean; newNonce: number }> {
    try {
      // Load both channel states
      const senderChannel = this.channels.get(senderChannelId);
      const recipientChannel = this.channels.get(recipientChannelId);
      
      if (!senderChannel || !recipientChannel) {
        throw new Error('Channel not found');
      }
      
      // Validate sufficient balance
      const senderBalance = parseFloat(senderChannel.balance);
      const paymentAmount = parseFloat(amount);
      
      if (senderBalance < paymentAmount) {
        throw new Error('Insufficient balance in channel');
      }
      
      // Update balances
      senderChannel.balance = (senderBalance - paymentAmount).toFixed(2);
      recipientChannel.balance = (
        parseFloat(recipientChannel.balance) + paymentAmount
      ).toFixed(2);
      
      // Increment nonces
      senderChannel.nonce++;
      recipientChannel.nonce++;
      
      // Update timestamps
      senderChannel.lastUpdatedAt = new Date();
      recipientChannel.lastUpdatedAt = new Date();
      
      // Update in memory
      this.channels.set(senderChannelId, senderChannel);
      this.channels.set(recipientChannelId, recipientChannel);
      
      // Update Redis cache
      await Promise.all([
        redisService.setWithExpiry(
          `channel:${senderChannelId}`,
          JSON.stringify(senderChannel),
          86400
        ),
        redisService.setWithExpiry(
          `channel:${recipientChannelId}`,
          JSON.stringify(recipientChannel),
          86400
        )
      ]);
      
      logger.info(
        `Off-chain payment processed: ${amount} from ${senderChannelId} to ${recipientChannelId}`
      );
      
      // Emit events
      this.emit('channel:payment', {
        senderChannelId,
        recipientChannelId,
        amount,
        nonce: senderChannel.nonce
      });
      
      return {
        success: true,
        newNonce: senderChannel.nonce
      };
      
    } catch (error) {
      logger.error('Off-chain payment failed:', error);
      throw error;
    }
  }
  
  /**
   * Gets channel state
   */
  async getChannelState(channelId: string): Promise<ChannelState | null> {
    // Try memory first
    const memoryState = this.channels.get(channelId);
    if (memoryState) {
      return memoryState;
    }
    
    // Try Redis
    const redisState = await redisService.get(`channel:${channelId}`);
    if (redisState) {
      const state = JSON.parse(redisState);
      this.channels.set(channelId, state); // Hydrate memory
      return state;
    }
    
    return null;
  }
  
  /**
   * Gets all channels for an employee
   */
  async getEmployeeChannels(employeeId: string): Promise<ChannelState[]> {
    const channels: ChannelState[] = [];
    
    for (const [_, state] of this.channels) {
      if (state.employeeId === employeeId) {
        channels.push(state);
      }
    }
    
    return channels;
  }
  
  /**
   * Closes a channel and settles on-chain
   */
  async closeChannel(channelId: string): Promise<{ txHash: string; finalBalance: string }> {
    try {
      const channel = this.channels.get(channelId);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      if (channel.status !== ChannelStatus.OPEN) {
        throw new Error('Channel is not open');
      }
      
      // Mark as settling
      channel.status = ChannelStatus.SETTLING;
      this.channels.set(channelId, channel);
      
      // TODO: Submit settlement transaction to blockchain
      // This would call the YellowStateChannel.sol contract
      // with the final signed state
      
      // Simulated settlement
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Mark as closed
      channel.status = ChannelStatus.CLOSED;
      this.channels.set(channelId, channel);
      
      // Clean up from Redis
      await redisService.del(`channel:${channelId}`);
      
      logger.info(`Channel closed: ${channelId}, final balance: ${channel.balance}`);
      
      // Emit event
      this.emit('channel:closed', {
        channelId,
        finalBalance: channel.balance,
        txHash: mockTxHash
      });
      
      return {
        txHash: mockTxHash,
        finalBalance: channel.balance
      };
      
    } catch (error) {
      logger.error('Failed to close channel:', error);
      throw error;
    }
  }
  
  /**
   * Monitors channels and auto-settles inactive ones
   */
  async monitorChannels(): Promise<void> {
    const now = Date.now();
    const TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [channelId, state] of this.channels) {
      const age = now - state.lastUpdatedAt.getTime();
      
      if (age > TIMEOUT_MS && state.status === ChannelStatus.OPEN) {
        logger.info(`Auto-settling inactive channel: ${channelId}`);
        await this.closeChannel(channelId);
      }
    }
  }
  
  /**
   * Gets channel statistics for organization
   */
  async getOrganizationChannelStats(organizationId: string): Promise<any> {
    const orgChannels = Array.from(this.channels.values()).filter(
      c => c.organizationId === organizationId
    );
    
    const totalBalance = orgChannels.reduce(
      (sum, c) => sum + parseFloat(c.balance),
      0
    );
    
    const activeChannels = orgChannels.filter(
      c => c.status === ChannelStatus.OPEN
    ).length;
    
    return {
      totalChannels: orgChannels.length,
      activeChannels,
      totalBalance: totalBalance.toFixed(2),
      averageBalance: (totalBalance / orgChannels.length || 0).toFixed(2)
    };
  }
}

export default new YellowNetworkService();
