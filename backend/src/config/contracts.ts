/**
 * TrustNet Backend - Contract Configuration
 * 
 * Centralized contract addresses and network configuration for backend services.
 * Last Updated: February 6, 2026
 */

interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  contracts: {
    membershipVerifier: string | null;
    amountVerifier: string | null;
    poolManager?: string | null;
    privacyPoolHook?: string | null;
  };
}

// Load from environment variables or use defaults
export const ETHEREUM_NETWORKS: Record<string, NetworkConfig> = {
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.BASE_RPC_URL || 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    isTestnet: true,
    
    contracts: {
      membershipVerifier: process.env.MEMBERSHIP_VERIFIER_ADDRESS || '0x0d2B09395Ae7C136e77892fC7EEFB0011898A4fe',
      amountVerifier: process.env.AMOUNT_VERIFIER_ADDRESS || '0xfcE235771639Bbfc1dfEE7c3b499551ae0C3D414',
      poolManager: '0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829',
      privacyPoolHook: process.env.PRIVACY_POOL_HOOK_ADDRESS || null,
    },
  },

  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    
    contracts: {
      membershipVerifier: null,
      amountVerifier: null,
      poolManager: null,
      privacyPoolHook: null,
    },
  },

  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    isTestnet: false,
    
    contracts: {
      membershipVerifier: null, // Deploy for production
      amountVerifier: null,
      poolManager: null,
      privacyPoolHook: null,
    },
  },
};

// Sui Network Configuration
export const SUI_NETWORKS = {
  testnet: {
    name: 'Sui Testnet',
    rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
    explorerUrl: 'https://testnet.suivision.xyz',
    isTestnet: true,
    
    packageId: process.env.SUI_PACKAGE_ID || '0xaea2bdfbdab9d4f0ae173214c078e86f3e50d04a5ed8195192dec53729e3dfef',
    
    modules: {
      employeeWallet: 'employee_wallet',
      organizationRegistry: 'organization_registry',
      payrollDistributor: 'payroll_distributor',
      privacyPool: 'privacy_pool',
    },
    
    usdc: {
      packageId: process.env.USDC_PACKAGE_ID || '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
      treasury: process.env.USDC_TREASURY || '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
    },
  },

  mainnet: {
    name: 'Sui Mainnet',
    rpcUrl: process.env.SUI_MAINNET_RPC_URL || 'https://fullnode.mainnet.sui.io:443',
    explorerUrl: 'https://suivision.xyz',
    isTestnet: false,
    
    packageId: process.env.SUI_MAINNET_PACKAGE_ID || null,
    
    modules: {
      employeeWallet: 'employee_wallet',
      organizationRegistry: 'organization_registry',
      payrollDistributor: 'payroll_distributor',
      privacyPool: 'privacy_pool',
    },
    
    usdc: {
      packageId: null,
      treasury: null,
    },
  },
};

// Current network based on environment
export const CURRENT_ETHEREUM_NETWORK = (() => {
  const network = process.env.ETHEREUM_NETWORK || 'baseSepolia';
  
  if (!ETHEREUM_NETWORKS[network]) {
    console.warn(`Unknown Ethereum network: ${network}, defaulting to baseSepolia`);
    return 'baseSepolia';
  }
  
  return network as keyof typeof ETHEREUM_NETWORKS;
})();

export const CURRENT_SUI_NETWORK = (() => {
  const network = process.env.SUI_NETWORK || 'testnet';
  
  if (!SUI_NETWORKS[network as keyof typeof SUI_NETWORKS]) {
    console.warn(`Unknown Sui network: ${network}, defaulting to testnet`);
    return 'testnet';
  }
  
  return network as keyof typeof SUI_NETWORKS;
})();

// Helper functions
export function getEthereumConfig(network?: string): NetworkConfig {
  const networkKey = network || CURRENT_ETHEREUM_NETWORK;
  const config = ETHEREUM_NETWORKS[networkKey];
  
  if (!config) {
    throw new Error(`Unknown Ethereum network: ${networkKey}`);
  }
  
  return config;
}

export function getSuiConfig(network?: string) {
  const networkKey = (network || CURRENT_SUI_NETWORK) as keyof typeof SUI_NETWORKS;
  const config = SUI_NETWORKS[networkKey];
  
  if (!config) {
    throw new Error(`Unknown Sui network: ${networkKey}`);
  }
  
  return config;
}

export function getVerifierAddress(type: 'membership' | 'amount', network?: string): string {
  const config = getEthereumConfig(network);
  const address = type === 'membership' 
    ? config.contracts.membershipVerifier 
    : config.contracts.amountVerifier;
  
  if (!address) {
    throw new Error(
      `${type} verifier not deployed on ${config.name}. ` +
      `Please deploy using: npm run deploy:verifiers -- --network ${network || CURRENT_ETHEREUM_NETWORK}`
    );
  }
  
  return address;
}

export function getExplorerUrl(address: string, network?: string): string {
  const config = getEthereumConfig(network);
  return `${config.explorerUrl}/address/${address}`;
}

export function getTransactionUrl(txHash: string, network?: string): string {
  const config = getEthereumConfig(network);
  return `${config.explorerUrl}/tx/${txHash}`;
}

// Export constants for quick access
export const VERIFIER_ADDRESSES = {
  membership: getVerifierAddress('membership'),
  amount: getVerifierAddress('amount'),
};

export const SUI_PACKAGE_ID = getSuiConfig().packageId;

export default {
  ethereum: ETHEREUM_NETWORKS,
  sui: SUI_NETWORKS,
  current: {
    ethereum: CURRENT_ETHEREUM_NETWORK,
    sui: CURRENT_SUI_NETWORK,
  },
  getEthereumConfig,
  getSuiConfig,
  getVerifierAddress,
  getExplorerUrl,
  getTransactionUrl,
  VERIFIER_ADDRESSES,
  SUI_PACKAGE_ID,
};
