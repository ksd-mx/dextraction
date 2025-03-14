import { create } from 'zustand';
import { Wallet } from '@/types/wallet';

interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  wallet: Wallet | null;
  availableWallets: Wallet[];
  connectWallet: (wallet: Wallet) => Promise<void>;
  disconnectWallet: () => void;
}

// Mock wallet data
const mockWallets: Wallet[] = [
  { id: 'phantom', name: 'Phantom', icon: '' },
  { id: 'solflare', name: 'Solflare', icon: '' },
  { id: 'backpack', name: 'Backpack', icon: '' },
  { id: 'glow', name: 'Glow', icon: '' },
];

export const useWalletStore = create<WalletState>((set) => ({
  isConnected: false,
  publicKey: null,
  wallet: null,
  availableWallets: mockWallets,
  
  connectWallet: async (wallet: Wallet) => {
    // This would connect to the wallet in a real implementation
    // For now, it simulates a successful connection
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a fake public key
      const publicKey = `${wallet.id}_${Math.random().toString(36).substring(2, 10)}`;
      
      set({
        isConnected: true,
        publicKey,
        wallet,
      });
      
      console.log(`Connected to ${wallet.name} wallet`);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // In a real app, we would handle the error and show a message to the user
    }
  },
  
  disconnectWallet: () => {
    set({
      isConnected: false,
      publicKey: null,
      wallet: null,
    });
    console.log('Wallet disconnected');
  },
}));