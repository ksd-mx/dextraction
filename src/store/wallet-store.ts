import { create } from 'zustand';
import { Wallet } from '@/core/types/wallet.types';

interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  wallet: Wallet | null;
  availableWallets: Wallet[];
  connectWallet: (wallet: Wallet) => Promise<void>;
  disconnectWallet: () => void;
}

// Updated wallet data with improved information
const mockWallets: Wallet[] = [
  { 
    id: 'phantom', 
    name: 'Phantom',
    icon: '/icons/phantom.svg' // Would need to add these icons to public/icons/
  },
  { 
    id: 'solflare', 
    name: 'Solflare',
    icon: '/icons/solflare.svg'
  },
  { 
    id: 'backpack', 
    name: 'Backpack',
    icon: '/icons/backpack.svg'
  },
  { 
    id: 'glow', 
    name: 'Glow',
    icon: '/icons/glow.svg'
  },
];

export const useWalletStore = create<WalletState>((set) => ({
  isConnected: false,
  publicKey: null,
  wallet: null,
  availableWallets: mockWallets,
  
  connectWallet: async (wallet: Wallet) => {
    // This would connect to the wallet in a real implementation
    try {
      // Generate a fake public key that looks like a Solana address
      const randomStr = Array.from(Array(32), () => Math.floor(Math.random() * 16).toString(16)).join('');
      const publicKey = wallet.id === 'phantom' 
        ? `${wallet.id}_${randomStr.substring(0, 32)}`
        : `${wallet.id}_${Math.random().toString(36).substring(2, 10)}`;
      
      set({
        isConnected: true,
        publicKey,
        wallet,
      });
      
      console.log(`Connected to ${wallet.name} wallet with public key ${publicKey}`);
      
      // Store in session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('connected_wallet', wallet.id);
        sessionStorage.setItem('public_key', publicKey);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  },
  
  disconnectWallet: () => {
    set({
      isConnected: false,
      publicKey: null,
      wallet: null,
    });
    
    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('connected_wallet');
      sessionStorage.removeItem('public_key');
    }
    
    console.log('Wallet disconnected');
  },
}));