// src/store/wallet/wallet.store.ts
import { create } from 'zustand';
import { Transaction } from '@solana/web3.js';
import { WalletService } from '@/services/wallet/wallet.service';
import { Wallet, WalletState } from '@/types/wallet.types';
import { showNotification } from '@/store/notification.store';

// Create wallet service instance
const walletService = new WalletService();

export const useWalletStore = create<WalletState>((set, get) => ({
  // State
  isConnected: false,
  isConnecting: false,
  publicKey: null,
  wallet: null,
  availableWallets: [],
  isWalletModalOpen: false,
  isWalletMenuOpen: false,
  connectionError: null,

  // UI actions
  openWalletModal: () => set({ 
    isWalletModalOpen: true,
    isWalletMenuOpen: false,
    connectionError: null 
  }),
  
  closeWalletModal: () => set({ 
    isWalletModalOpen: false 
  }),
  
  toggleWalletMenu: () => set(state => ({ 
    isWalletMenuOpen: !state.isWalletMenuOpen 
  })),
  
  closeWalletMenu: () => set({ 
    isWalletMenuOpen: false 
  }),

  // Wallet actions
  connect: async (walletId: string) => {
    try {
      set({ 
        isConnecting: true, 
        connectionError: null 
      });
      
      const { walletInfo, publicKey } = await walletService.connectWallet(walletId);
      
      set({
        isConnected: true,
        isConnecting: false,
        publicKey,
        wallet: walletInfo,
        isWalletModalOpen: false
      });
      
      showNotification({
        type: 'success',
        title: 'WALLET CONNECTED',
        message: `Successfully connected to ${walletInfo.name}`,
        position: 'bottom'
      });
      
      return true;
    } catch (error) {
      console.error('Wallet connection error:', error);
      set({
        isConnecting: false,
        connectionError: error instanceof Error ? error.message : 'Failed to connect wallet'
      });
      return false;
    }
  },
  
  disconnect: async () => {
    try {
      await walletService.disconnectWallet();
      
      set({
        isConnected: false,
        publicKey: null,
        wallet: null,
        isWalletMenuOpen: false
      });
      
      showNotification({
        type: 'info',
        title: 'WALLET DISCONNECTED',
        message: 'Your wallet has been disconnected',
        position: 'bottom'
      });
      
      return true;
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      return false;
    }
  },
  
  signTransaction: async (transaction: Transaction) => {
    if (!get().isConnected || !get().publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await walletService.signTransaction(transaction);
    } catch (error) {
      console.error('Transaction signing error:', error);
      if (error instanceof Error && error.message.includes('User rejected')) {
        throw new Error('Transaction rejected by user');
      }
      throw error;
    }
  },
  
  sendTransaction: async (transaction: Transaction) => {
    if (!get().isConnected || !get().publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await walletService.sendTransaction(transaction);
    } catch (error) {
      console.error('Transaction sending error:', error);
      if (error instanceof Error && error.message.includes('User rejected')) {
        throw new Error('Transaction rejected by user');
      }
      throw error;
    }
  },

  // Initialization helpers
  setAvailableWallets: (wallets: Wallet[]) => {
    set({ availableWallets: wallets });
  },
  
  setWalletState: (state: Partial<WalletState>) => {
    set(state);
  }
}));