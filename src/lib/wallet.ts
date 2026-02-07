import { ethers } from 'ethers'

interface EthereumProvider {
  isMetaMask?: boolean
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, callback: (...args: any[]) => void) => void
  removeListener: (event: string, callback: (...args: any[]) => void) => void
  selectedAddress: string | null
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export interface WalletState {
  address: string | null
  chainId: number | null
  connected: boolean
}

export class WalletService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null

  async connectWallet(): Promise<WalletState> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()
      
      const address = accounts[0]
      const network = await this.provider.getNetwork()
      const chainId = Number(network.chainId)

      return {
        address,
        chainId,
        connected: true,
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      throw new Error(error.message || 'Failed to connect wallet')
    }
  }

  async switchToBaseSepolia(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    const BASE_SEPOLIA_CHAIN_ID = '0x14A34' // 84532 in hex

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
      })
    } catch (error: any) {
      // Chain doesn't exist, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: BASE_SEPOLIA_CHAIN_ID,
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            },
          ],
        })
      } else {
        throw error
      }
    }
  }

  async sendPayment(
    toAddress: string,
    amountInEth: string
  ): Promise<{ txHash: string; status: 'success' | 'failed' }> {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amountInEth),
      })

      console.log('Transaction sent:', tx.hash)
      
      // Wait for confirmation
      const receipt = await tx.wait()
      
      return {
        txHash: tx.hash,
        status: receipt?.status === 1 ? 'success' : 'failed',
      }
    } catch (error: any) {
      console.error('Error sending payment:', error)
      throw new Error(error.message || 'Failed to send payment')
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    const balance = await this.provider.getBalance(address)
    return ethers.formatEther(balance)
  }

  disconnectWallet(): void {
    this.provider = null
    this.signer = null
  }

  // Listen for account changes
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', callback)
    }
  }

  // Listen for chain changes
  onChainChanged(callback: (chainId: string) => void): void {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', callback)
    }
  }

  // Remove listeners
  removeListeners(): void {
    if (window.ethereum) {
      // Note: MetaMask doesn't expose removeAllListeners in types
      // We'll just rely on the component cleanup
    }
  }
}

export const walletService = new WalletService()
