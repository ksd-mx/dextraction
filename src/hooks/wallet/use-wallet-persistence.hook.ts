// src/hooks/wallet/use-wallet-persistence.hook.ts
import { useEffect, useCallback } from 'react';
import { useWalletConnection } from '@/hooks/wallet/use-wallet-connection.hook';
import { useWalletAdapter } from '@/hooks/wallet/use-wallet-adapter.hook';

// Local storage keys
const STORAGE_KEYS = {
  WALLET_NAME: 'dextract_wallet_name',
  AUTO_CONNECT: 'dextract_auto_connect'
};

export function useWalletPersistence() {
  const { connect, isConnected, wallet } = useWalletConnection();
  const { detectedWallets, isDetecting } = useWalletAdapter();

  // Save wallet connection preference
  const saveWalletPreference = useCallback((walletName: string) => {
    localStorage.setItem(STORAGE_KEYS.WALLET_NAME, walletName);
    localStorage.setItem(STORAGE_KEYS.AUTO_CONNECT, 'true');
  }, []);

  // Clear saved wallet preferences
  const clearWalletPreference = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.WALLET_NAME);
    localStorage.removeItem(STORAGE_KEYS.AUTO_CONNECT);
    
    // Clear additional wallet-specific items
    localStorage.removeItem('walletAdapter');
    
    // Some wallets like Phantom store their own items
    localStorage.removeItem('Phantom');
    localStorage.removeItem('coinbase-wallet');
    localStorage.removeItem('solflare');
  }, []);

  // Check if wallet should auto-connect
  const shouldAutoConnect = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTO_CONNECT) === 'true';
  }, []);

  // Get last connected wallet name
  const getLastWalletName = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.WALLET_NAME);
  }, []);
  
  // Save current connection
  useEffect(() => {
    if (isConnected && wallet) {
      saveWalletPreference(wallet.id);
    }
  }, [isConnected, wallet, saveWalletPreference]);

  // Auto-connect to last wallet
  useEffect(() => {
    const attemptReconnection = async () => {
      // Don't try to connect if already connected or still detecting wallets
      if (isConnected || isDetecting) {
        return;
      }
      
      // Check if we should auto-connect
      if (!shouldAutoConnect()) {
        return;
      }
      
      // Get the last wallet name
      const lastWalletName = getLastWalletName();
      if (!lastWalletName) {
        return;
      }
      
      // Verify the wallet is available
      const isWalletAvailable = detectedWallets.some(w => w.id === lastWalletName);
      if (!isWalletAvailable) {
        console.log(`Wallet ${lastWalletName} is not available for auto-connect`);
        return;
      }
      
      // Attempt to connect
      console.log(`Auto-connecting to wallet: ${lastWalletName}`);
      try {
        await connect(lastWalletName);
      } catch (error) {
        console.error('Auto-connect failed:', error);
        // Clear preferences if auto-connect fails
        clearWalletPreference();
      }
    };
    
    attemptReconnection();
  }, [isConnected, isDetecting, detectedWallets, connect, shouldAutoConnect, getLastWalletName, clearWalletPreference]);

  return {
    saveWalletPreference,
    clearWalletPreference,
    shouldAutoConnect,
    getLastWalletName
  };
}