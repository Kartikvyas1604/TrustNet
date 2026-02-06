export interface IOrganization {
  id?: string;
  organizationId: string; // Unique identifier (e.g., "acme-corp")
  name: string;
  registrationNumber?: string;
  country: string;
  kycStatus: KYCStatus;
  kycDocuments?: string[]; // IPFS hashes
  subscriptionTier: SubscriptionTier;
  employeeLimit: number;
  adminWallets: AdminWallet[];
  treasuryAddresses: TreasuryAddresses;
  ensName?: string; // e.g., "acme-corp.eth"
  contractAddresses?: ContractAddresses;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export enum KYCStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum SubscriptionTier {
  STARTER = 'starter',      // 1-10 employees
  BUSINESS = 'business',    // 11-100 employees
  ENTERPRISE = 'enterprise' // Unlimited
}

export interface AdminWallet {
  address: string;
  role: AdminRole;
  addedAt: Date;
}

export enum AdminRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  FINANCE = 'finance',
  AUDITOR = 'auditor'
}

export interface TreasuryAddresses {
  ethereum?: string;
  base?: string;
  polygon?: string;
  arbitrum?: string;
  sui?: string;
  arc?: string;
}

export interface ContractAddresses {
  organizationRegistry?: string;
  privacyPool?: string;
  stateChannel?: string;
}


export interface IEmployee {
  id?: string;
  employeeId: string; // Unique identifier
  organizationId: string; // Reference to parent organization
  walletAddresses: WalletAddresses;
  authKeyHash: string; // SHA256 hash of the auth key used
  ensName?: string; // e.g., "alice.acme-corp.eth"
  profileData?: EmployeeProfile;
  onboardingDate: Date;
  status: EmployeeStatus;
  privacyPreferences?: PrivacyPreferences;
  channels?: StateChannelReference[];
  createdAt: Date;
  updatedAt: Date;
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked'
}

export interface WalletAddresses {
  ethereum?: string;
  base?: string;
  polygon?: string;
  arbitrum?: string;
  sui?: string;
  arc?: string;
}

export interface EmployeeProfile {
  nickname?: string;
  avatar?: string; // IPFS hash or URL
  email?: string;
  phoneNumber?: string;
}

export interface PrivacyPreferences {
  defaultPrivacyLevel: PrivacyLevel;
  preferredChain?: string;
  notificationSettings?: NotificationSettings;
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  ORGANIZATION_ONLY = 'organization_only',
  FULLY_PRIVATE = 'fully_private'
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  webhook?: string;
}

export interface StateChannelReference {
  channelId: string;
  network: string; // 'yellow', 'state-channels', etc.
  status: string;
  openedAt: Date;
}

// ============================================================================
// AUTH KEY TYPES
// ============================================================================

export interface IAuthKey {
  id?: string;
  keyHash: string; // SHA256 hash of the key
  organizationId: string;
  status: AuthKeyStatus;
  assignedEmployeeId?: string;
  generatedAt: Date;
  usedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export enum AuthKeyStatus {
  UNUSED = 'unused',
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired'
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface ITransaction {
  id?: string;
  transactionId: string;
  organizationId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  amount: string; // Use string to avoid floating point issues
  currency: string; // 'USDC', 'ETH', 'SUI', etc.
  chain: string; // 'ethereum', 'sui', 'base', etc.
  transactionType: TransactionType;
  blockchainTxHash?: string;
  privacyLevel: PrivacyLevel;
  encryptedDetails?: string; // AES-256 encrypted transaction details
  commitmentHash?: string; // For ZK transactions
  nullifier?: string; // For ZK transactions
  status: TransactionStatus;
  timestamp: Date;
  gasUsed?: string;
  metadata?: Record<string, any>;
}

export enum TransactionType {
  YELLOW_OFFCHAIN = 'yellow_offchain',
  UNISWAP_PRIVACY = 'uniswap_privacy',
  SUI_DIRECT = 'sui_direct',
  CROSS_CHAIN = 'cross_chain',
  PAYROLL = 'payroll'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// ============================================================================
// STATE CHANNEL TYPES
// ============================================================================

export interface IStateChannel {
  id?: string;
  channelId: string;
  employeeId: string;
  organizationId: string;
  channelState: ChannelState;
  depositAmount: string;
  currentBalance: string;
  status: ChannelStatus;
  openedAt: Date;
  lastUpdatedAt: Date;
  closedAt?: Date;
  settlementTxHash?: string;
  metadata?: Record<string, any>;
}

export interface ChannelState {
  balances: {
    [address: string]: string;
  };
  nonce: number;
  signatures: string[];
  timeout: number;
}

export enum ChannelStatus {
  OPENING = 'opening',
  OPEN = 'open',
  SETTLING = 'settling',
  CLOSED = 'closed',
  DISPUTED = 'disputed'
}

// ============================================================================
// MERKLE TREE TYPES
// ============================================================================

export interface IMerkleTree {
  id?: string;
  organizationId: string;
  treeRoot: string;
  treeHeight: number;
  leaves: string[];
  lastUpdatedAt: Date;
  previousRoots: PreviousRoot[];
}

export interface PreviousRoot {
  root: string;
  timestamp: Date;
  employeeCount: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Organization Registration Request
export interface RegisterOrganizationRequest {
  name: string;
  registrationNumber?: string;
  country: string;
  subscriptionTier: SubscriptionTier;
  adminWallet: string;
  kycDocuments?: string[];
}

// Employee Onboarding Request
export interface OnboardEmployeeRequest {
  authKey: string;
  walletAddress: string;
  signature: string;
  chain: string;
  profileData?: EmployeeProfile;
}

// Transaction Request
export interface CreateTransactionRequest {
  fromEmployeeId: string;
  toEmployeeId?: string;
  toAddress?: string;
  toEnsName?: string;
  amount: string;
  currency: string;
  chain?: string;
  privacyLevel?: PrivacyLevel;
  memo?: string;
}

// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================

export enum WebSocketEvent {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  AUTHENTICATE = 'authenticate',
  
  // Transaction events
  TRANSACTION_SUBMITTED = 'transaction_submitted',
  TRANSACTION_PENDING = 'transaction_pending',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
  
  // Balance events
  BALANCE_UPDATED = 'balance_updated',
  
  // Channel events
  CHANNEL_OPENED = 'channel_opened',
  CHANNEL_UPDATED = 'channel_updated',
  CHANNEL_CLOSED = 'channel_closed',
  
  // Organization events
  EMPLOYEE_JOINED = 'employee_joined',
  ORGANIZATION_STATS_UPDATED = 'organization_stats_updated'
}

export interface WebSocketMessage {
  event: WebSocketEvent;
  data: any;
  timestamp: string;
  userId?: string;
}

// ============================================================================
// SERVICE CONFIGURATION TYPES
// ============================================================================

export interface ServiceConfig {
  environment: 'development' | 'staging' | 'production';
  port: number;
  mongoUri: string;
  redisUrl: string;
  jwtSecret: string;
  encryptionKey: string;
}

export interface BlockchainConfig {
  ethereumRpcUrl: string;
  suiRpcUrl: string;
  baseRpcUrl: string;
  ensRegistry: string;
  ensController: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T>;
