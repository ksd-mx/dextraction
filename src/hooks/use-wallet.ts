import { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import { delay } from '@/lib/utils';

export function useWallet() {
  const { 
    isConnected, 
    publicKey, 
    wallet, 
    availableWallets,
    connectWallet, 
    disconnectWallet 
  } = useWalletStore();
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const openWalletModal = useCallback(() => {
    setIsWalletModalOpen(true);
    setConnectionError(null);
  }, []);

  const closeWalletModal = useCallback(() => {
    setIsWalletModalOpen(false);
  }, []);

  const connect = useCallback(async (walletId: string) => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      const walletToConnect = availableWallets.find(w => w.id === walletId);
      
      if (!walletToConnect) {
        throw new Error('Wallet not found');
      }
      
      // Simulating real wallet connection (would be actual connection in production)
      await delay(1000); // Simulate connection delay
      
      // In real implementation, you would check if the wallet is installed
      // For the demo, we'll assume it's installed and just connect
      
      await connectWallet(walletToConnect);
      closeWalletModal();
      return true;
    } catch (error) {
      console.error('Wallet connection error:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [availableWallets, connectWallet, closeWalletModal]);

  const disconnect = useCallback(async () => {
    try {
      disconnectWallet();
      return true;
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      return false;
    }
  }, [disconnectWallet]);

  // Clean up connection error after a while
  useEffect(() => {
    if (connectionError) {
      const timer = setTimeout(() => {
        setConnectionError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  return {
    isConnected,
    publicKey,
    wallet,
    availableWallets,
    isWalletModalOpen,
    openWalletModal,
    closeWalletModal,
    connect,
    disconnect,
    isConnecting,
    connectionError,
  };
}