import { Transaction } from '@solana/web3.js';
import { Wallet } from '@/core/types/wallet.types';

// Demo wallet data
const MOCK_WALLETS: Wallet[] = [
  { 
    id: 'Phantom', 
    name: 'Phantom',
    icon: '/icons/phantom.svg'
  },
  { 
    id: 'Solflare', 
    name: 'Solflare',
    icon: '/icons/solflare.svg'
  },
  { 
    id: 'Backpack', 
    name: 'Backpack',
    icon: '/icons/backpack.svg'
  },
  { 
    id: 'Glow', 
    name: 'Glow',
    icon: '/icons/glow.svg'
  },
  { 
    id: 'Brave', 
    name: 'Brave',
    icon: '/icons/brave.svg'
  },
  { 
    id: 'Coinbase', 
    name: 'Coinbase Wallet',
    icon: '/icons/coinbase.svg'
  },
];

/**
 * Service for managing wallet connections and transactions
 */
export class WalletService {
  /**
   * Get list of available wallets
   */
  async getAvailableWallets(): Promise<Wallet[]> {
    // In a real implementation, we would check if the wallets are installed
    // For demo purposes, we'll just return the mock wallets
    return MOCK_WALLETS;
  }
  
  /**
   * Connect to a wallet
   */
  async connectWallet(walletId: string): Promise<{ 
    walletInfo: Wallet, 
    publicKey: string 
  }> {
    // Simulate wallet connection
    const wallet = MOCK_WALLETS.find(w => w.id === walletId);
    
    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }
    
    // Generate a fake public key
    const randomStr = Array.from(Array(32), () => Math.floor(Math.random() * 16).toString(16)).join('');
    const publicKey = `${walletId}_${randomStr.substring(0, 32)}`;
    
    // Store wallet info in local storage for later recovery
    if (typeof window !== 'undefined') {
      localStorage.setItem('walletId', wallet.id);
      localStorage.setItem('publicKey', publicKey);
    }
    
    return { walletInfo: wallet, publicKey };
  }
  
  /**
   * Disconnect from current wallet
   */
  async disconnectWallet(): Promise<void> {
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletId');
      localStorage.removeItem('publicKey');
    }
  }
  
  /**
   * Try to restore wallet connection from local storage
   */
  async tryRestoreConnection(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const walletId = localStorage.getItem('walletId');
    const publicKey = localStorage.getItem('publicKey');
    
    return !!(walletId && publicKey);
  }
  
  /**
   * Get stored wallet name
   */
  getStoredWalletName(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('walletId');
  }
  
  /**
   * Get stored public key
   */
  getStoredPublicKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('publicKey');
  }
  
  /**
   * Sign a transaction
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    // In a real implementation, this would use the wallet adapter
    // For demo purposes, we'll just return the transaction as is
    return transaction;
  }
  
  /**
   * Send a transaction
   */
  async sendTransaction(): Promise<string> {
    // In a real implementation, this would use the wallet adapter
    // For demo purposes, we'll just return a fake transaction signature
    return `demo_${Math.random().toString(36).substring(2, 15)}`;
  }
}