import { Transaction } from '@solana/web3.js';

// Basic wallet interface
export interface Wallet {
  id: string;
  name: string;
  icon: string;
}

// Wallet connection state
export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  wallet: Wallet | null;
}

// Wallet connection error
export interface WalletConnectionError {
  code?: string;
  message: string;
}

// Wallet transaction functions
export interface WalletTransactionFunctions {
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  sendTransaction: (transaction: Transaction) => Promise<string>;
}

// Combined wallet state and functions
export interface WalletState extends WalletConnectionState, WalletTransactionFunctions {
  availableWallets: Wallet[];
  isWalletModalOpen: boolean;
  isWalletMenuOpen: boolean;
  connectionError: string | null;
  
  openWalletModal: () => void;
  closeWalletModal: () => void;
  toggleWalletMenu: () => void;
  closeWalletMenu: () => void;
  connect: (walletId: string) => Promise<boolean>;
  disconnect: () => void;
}