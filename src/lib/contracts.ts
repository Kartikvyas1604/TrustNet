export const NETWORK_CONFIG = {
  // Base Sepolia Testnet
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    isTestnet: true,
    
    contracts: {
      // ZK Proof Verifiers
      membershipVerifier: '0x0d2B09395Ae7C136e77892fC7EEFB0011898A4fe' as string,
      amountVerifier: '0xfcE235771639Bbfc1dfEE7c3b499551ae0C3D414' as string,
      
      // Uniswap v4
      poolManager: '0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829' as string,
      privacyPoolHook: null as string | null, // To be deployed
      
      // ENS (not used on Base)
      ensRegistry: null as string | null,
      ensResolver: null as string | null,
    },
  },

  // Ethereum Sepolia Testnet
  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    
    contracts: {
      membershipVerifier: null as string | null, // Not deployed yet
      amountVerifier: null as string | null,
      poolManager: null as string | null,
      privacyPoolHook: null as string | null,
      ensRegistry: null as string | null,
      ensResolver: null as string | null,
    },
  },

  // Base Mainnet
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    isTestnet: false,
    
    contracts: {
      membershipVerifier: null as string | null, // Production deployment pending
      amountVerifier: null as string | null,
      poolManager: null as string | null,
      privacyPoolHook: null as string | null,
      ensRegistry: null as string | null,
      ensResolver: null as string | null,
    },
  },

  // Ethereum Mainnet
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
    
    contracts: {
      membershipVerifier: null as string | null, // Production deployment pending
      amountVerifier: null as string | null,
      poolManager: null as string | null,
      privacyPoolHook: null as string | null,
      ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as string,
      ensResolver: null as string | null,
    },
  },
} as const;

// Sui Network Configuration
export const SUI_NETWORK_CONFIG = {
  // Sui Testnet
  testnet: {
    name: 'Sui Testnet',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    explorerUrl: 'https://testnet.suivision.xyz',
    isTestnet: true,
    
    contracts: {
      packageId: '0xaea2bdfbdab9d4f0ae173214c078e86f3e50d04a5ed8195192dec53729e3dfef',
      modules: {
        employeeWallet: 'employee_wallet',
        organizationRegistry: 'organization_registry',
        payrollDistributor: 'payroll_distributor',
        privacyPool: 'privacy_pool',
      },
      usdcPackageId: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
      usdcTreasury: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
    },
  },

  // Sui Mainnet
  mainnet: {
    name: 'Sui Mainnet',
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    explorerUrl: 'https://suivision.xyz',
    isTestnet: false,
    
    contracts: {
      packageId: null, // Production deployment pending
      modules: {
        employeeWallet: 'employee_wallet',
        organizationRegistry: 'organization_registry',
        payrollDistributor: 'payroll_distributor',
        privacyPool: 'privacy_pool',
      },
      usdcPackageId: null,
      usdcTreasury: null,
    },
  },
} as const;

// Helper function to get contract address by network
export function getContractAddress(
  network: keyof typeof NETWORK_CONFIG,
  contractName: keyof typeof NETWORK_CONFIG.baseSepolia.contracts
): string {
  const networkConfig = NETWORK_CONFIG[network];
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`);
  }
  
  const address = networkConfig.contracts[contractName];
  
  if (!address) {
    throw new Error(
      `Contract ${contractName} not deployed on ${network}. ` +
      `Please deploy the contract first or check the network name.`
    );
  }
  
  return address;
}

// Helper function to get Sui package ID
export function getSuiPackageId(network: 'testnet' | 'mainnet'): string {
  const packageId = SUI_NETWORK_CONFIG[network]?.contracts.packageId;
  
  if (!packageId) {
    throw new Error(
      `Sui contracts not deployed on ${network}. ` +
      `Please deploy using: cd contracts && sui client publish`
    );
  }
  
  return packageId;
}

// Helper function to get explorer URL for a contract
export function getExplorerUrl(
  network: keyof typeof NETWORK_CONFIG,
  address: string
): string {
  const config = NETWORK_CONFIG[network];
  
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  
  return `${config.explorerUrl}/address/${address}`;
}

// Export default for convenience
export default {
  eth: NETWORK_CONFIG,
  sui: SUI_NETWORK_CONFIG,
  getContractAddress,
  getSuiPackageId,
  getExplorerUrl,
};
