/**
 * Application Constants for TrustNet Backend
 * 
 * Centralized constants for configuration, limits, and enumerations.
 */

// ============================================================================
// SUBSCRIPTION TIER LIMITS
// ============================================================================

export const SUBSCRIPTION_LIMITS = {
  starter: {
    employeeLimit: 10,
    transactionsPerMonth: 1000,
    priceUSD: 99
  },
  business: {
    employeeLimit: 100,
    transactionsPerMonth: 10000,
    priceUSD: 499
  },
  enterprise: {
    employeeLimit: Infinity,
    transactionsPerMonth: Infinity,
    priceUSD: 'custom'
  }
} as const;

// ============================================================================
// TRANSACTION LIMITS AND THRESHOLDS
// ============================================================================

export const TRANSACTION_LIMITS = {
  // Yellow Network off-chain transaction threshold
  YELLOW_OFFCHAIN_MAX_AMOUNT: '100', // USDC
  
  // Minimum transaction amount
  MIN_TRANSACTION_AMOUNT: '0.01', // USDC
  
  // Maximum transaction amount without additional verification
  MAX_TRANSACTION_AMOUNT: '10000', // USDC
  
  // AML reporting threshold
  AML_REPORTING_THRESHOLD: '10000', // USDC
  
  // Channel settlement threshold
  CHANNEL_SETTLEMENT_THRESHOLD: '1000', // USDC
  
  // Channel timeout (in seconds)
  CHANNEL_TIMEOUT: 86400, // 24 hours
  
  // Maximum off-chain transactions per employee per minute
  MAX_OFFCHAIN_TXS_PER_MINUTE: 100,
  
  // Maximum on-chain settlements per employee per hour
  MAX_SETTLEMENTS_PER_HOUR: 10
} as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

export const RATE_LIMITS = {
  // Public endpoints (registration, login)
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5
  },
  
  // Authenticated endpoints (transactions)
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60
  },
  
  // Admin endpoints
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  },
  
  // WebSocket connections per IP
  websocket: {
    windowMs: 60 * 1000, // 1 minute
    maxConnections: 10
  }
} as const;

// ============================================================================
// JWT TOKEN CONFIGURATION
// ============================================================================

export const JWT_CONFIG = {
  // Access token expiration
  ACCESS_TOKEN_EXPIRY: '15m',
  
  // Refresh token expiration
  REFRESH_TOKEN_EXPIRY: '7d',
  
  // Session token expiration (for employees)
  SESSION_TOKEN_EXPIRY: '24h',
  
  // Admin token expiration
  ADMIN_TOKEN_EXPIRY: '1h'
} as const;

// ============================================================================
// BLOCKCHAIN CONFIGURATIONS
// ============================================================================

export const BLOCKCHAIN_NETWORKS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
    explorer: 'https://etherscan.io'
  },
  base: {
    chainId: 8453,
    name: 'Base',
    nativeCurrency: 'ETH',
    explorer: 'https://basescan.org'
  },
  sui: {
    chainId: 'sui:mainnet',
    name: 'Sui Mainnet',
    nativeCurrency: 'SUI',
    explorer: 'https://suiexplorer.com'
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    nativeCurrency: 'MATIC',
    explorer: 'https://polygonscan.com'
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    nativeCurrency: 'ETH',
    explorer: 'https://arbiscan.io'
  }
} as const;

export const SUPPORTED_CHAINS = Object.keys(BLOCKCHAIN_NETWORKS);

// ============================================================================
// SUPPORTED CURRENCIES
// ============================================================================

export const SUPPORTED_CURRENCIES = [
  'USDC',
  'ETH',
  'SUI',
  'MATIC',
  'USDT'
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// ============================================================================
// GAS CONFIGURATION
// ============================================================================

export const GAS_LIMITS = {
  // Standard transfer
  TRANSFER: '100000',
  
  // Privacy pool swap
  PRIVACY_SWAP: '300000',
  
  // State channel settlement
  CHANNEL_SETTLEMENT: '150000',
  
  // Organization registration
  ORG_REGISTRATION: '200000',
  
  // Employee onboarding
  EMPLOYEE_ONBOARDING: '150000',
  
  // Merkle root update
  MERKLE_UPDATE: '100000'
} as const;

// ============================================================================
// REDIS CACHE TTL (Time To Live in seconds)
// ============================================================================

export const CACHE_TTL = {
  // ENS resolution cache
  ENS_RESOLUTION: 3600, // 1 hour
  
  // Balance cache
  BALANCE: 30, // 30 seconds
  
  // Organization data cache
  ORGANIZATION: 300, // 5 minutes
  
  // Employee session cache
  SESSION: 86400, // 24 hours
  
  // Transaction status cache
  TRANSACTION_STATUS: 60, // 1 minute
  
  // Channel state cache
  CHANNEL_STATE: 10 // 10 seconds
} as const;

// ============================================================================
// WEBSOCKET EVENTS
// ============================================================================

export const WS_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  
  // Transactions
  TRANSACTION_SUBMITTED: 'transaction_submitted',
  TRANSACTION_PENDING: 'transaction_pending',
  TRANSACTION_CONFIRMED: 'transaction_confirmed',
  TRANSACTION_FAILED: 'transaction_failed',
  
  // Balance
  BALANCE_UPDATED: 'balance_updated',
  
  // Channels
  CHANNEL_OPENED: 'channel_opened',
  CHANNEL_UPDATED: 'channel_updated',
  CHANNEL_CLOSED: 'channel_closed',
  
  // Organization
  EMPLOYEE_JOINED: 'employee_joined',
  ORGANIZATION_STATS_UPDATED: 'organization_stats_updated',
  
  // Payroll
  PAYROLL_INITIATED: 'payroll_initiated',
  PAYROLL_COMPLETED: 'payroll_completed'
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_KEY: 'AUTH_001',
  AUTH_KEY_EXPIRED: 'AUTH_002',
  AUTH_KEY_ALREADY_USED: 'AUTH_003',
  AUTH_INVALID_SIGNATURE: 'AUTH_004',
  AUTH_UNAUTHORIZED: 'AUTH_005',
  
  // Organization errors
  ORG_NOT_FOUND: 'ORG_001',
  ORG_KYC_PENDING: 'ORG_002',
  ORG_EMPLOYEE_LIMIT_REACHED: 'ORG_003',
  ORG_INSUFFICIENT_BALANCE: 'ORG_004',
  
  // Employee errors
  EMP_NOT_FOUND: 'EMP_001',
  EMP_ALREADY_EXISTS: 'EMP_002',
  EMP_INACTIVE: 'EMP_003',
  
  // Transaction errors
  TXN_INSUFFICIENT_BALANCE: 'TXN_001',
  TXN_INVALID_AMOUNT: 'TXN_002',
  TXN_INVALID_RECIPIENT: 'TXN_003',
  TXN_RATE_LIMIT_EXCEEDED: 'TXN_004',
  TXN_BLOCKCHAIN_ERROR: 'TXN_005',
  
  // Channel errors
  CHANNEL_NOT_FOUND: 'CHANNEL_001',
  CHANNEL_ALREADY_OPEN: 'CHANNEL_002',
  CHANNEL_SETTLEMENT_FAILED: 'CHANNEL_003',
  
  // General errors
  VALIDATION_ERROR: 'VAL_001',
  DATABASE_ERROR: 'DB_001',
  NETWORK_ERROR: 'NET_001',
  INTERNAL_ERROR: 'INT_001'
} as const;

// ============================================================================
// API RESPONSE MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  ORG_REGISTERED: 'Organization registered successfully',
  EMPLOYEE_ONBOARDED: 'Employee onboarded successfully',
  TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
  CHANNEL_OPENED: 'State channel opened successfully',
  CHANNEL_CLOSED: 'State channel closed successfully',
  BALANCE_UPDATED: 'Balance updated successfully'
} as const;

// ============================================================================
// CRON JOB SCHEDULES
// ============================================================================

export const CRON_SCHEDULES = {
  // Daily at 2 AM - Channel settlement
  DAILY_CHANNEL_SETTLEMENT: '0 2 * * *',
  
  // Weekly on Monday at 9 AM - Payroll processing
  WEEKLY_PAYROLL: '0 9 * * 1',
  
  // Hourly - Merkle tree updates
  HOURLY_MERKLE_UPDATE: '0 * * * *',
  
  // Monthly on 1st at midnight - Compliance reports
  MONTHLY_COMPLIANCE_REPORT: '0 0 1 * *',
  
  // Daily at 3 AM - Data cleanup
  DAILY_CLEANUP: '0 3 * * *',
  
  // Every 5 minutes - Balance sync
  BALANCE_SYNC: '*/5 * * * *'
} as const;

// ============================================================================
// FILE UPLOAD LIMITS
// ============================================================================

export const UPLOAD_LIMITS = {
  // KYC documents
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  ALLOWED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  MAX_FILES_PER_UPLOAD: 5
} as const;

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

// ============================================================================
// MERKLE TREE CONFIGURATION
// ============================================================================

export const MERKLE_TREE_CONFIG = {
  // Tree height (supports 2^20 = ~1 million employees)
  HEIGHT: 20,
  
  // Hash function
  HASH_FUNCTION: 'sha256',
  
  // Zero value for empty leaves
  ZERO_VALUE: '0x0000000000000000000000000000000000000000000000000000000000000000'
} as const;

export default {
  SUBSCRIPTION_LIMITS,
  TRANSACTION_LIMITS,
  RATE_LIMITS,
  JWT_CONFIG,
  BLOCKCHAIN_NETWORKS,
  SUPPORTED_CHAINS,
  SUPPORTED_CURRENCIES,
  GAS_LIMITS,
  CACHE_TTL,
  WS_EVENTS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  CRON_SCHEDULES,
  UPLOAD_LIMITS,
  PAGINATION,
  MERKLE_TREE_CONFIG
};
