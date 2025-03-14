import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base';
import { showNotification } from '@/store/notification-store';
import { Wallet } from '@/types/wallet';

export function useWallet() {
  const { 
    wallets,
    select,
    disconnect: disconnectWallet,
    connected,
    connecting,
    publicKey,
    wallet: selectedWallet,
  } = useSolanaWallet();
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Track connection state to prevent multiple notifications
  const prevConnectedRef = useRef(false);
  const notificationShownRef = useRef(false);

  // Format wallets for our UI
  const availableWallets: Wallet[] = wallets
    .filter(wallet => wallet.readyState === WalletReadyState.Installed || wallet.readyState === WalletReadyState.Loadable)
    .map(wallet => ({
      id: wallet.adapter.name as string,
      name: wallet.adapter.name,
      icon: wallet.adapter.icon,
    }));

  const openWalletModal = useCallback(() => {
    setIsWalletModalOpen(true);
    setIsWalletMenuOpen(false);
    setConnectionError(null);
  }, []);

  const closeWalletModal = useCallback(() => {
    setIsWalletModalOpen(false);
  }, []);

  const toggleWalletMenu = useCallback(() => {
    setIsWalletMenuOpen(prev => !prev);
  }, []);

  const closeWalletMenu = useCallback(() => {
    setIsWalletMenuOpen(false);
  }, []);

  const connect = useCallback(async (walletId: string) => {
    try {
      setConnectionError(null);
      console.log('Attempting to connect to wallet:', walletId);
      
      const walletToConnect = wallets.find(w => w.adapter.name === walletId);
      
      if (!walletToConnect) {
        console.error('Wallet not found:', walletId);
        throw new Error(`${walletId} wallet not found`);
      }
      
      console.log('Found wallet:', walletToConnect.adapter.name);
      
      // Reset notification state when attempting to connect
      notificationShownRef.current = false;
      
      console.log('Selecting wallet:', walletToConnect.adapter.name);
      select(walletToConnect.adapter.name as WalletName);
      closeWalletModal();
      
      console.log('Wallet connection successful');
      
      // Show connection notification immediately after successful connection
      showNotification.success(
        'WALLET CONNECTED',
        `Successfully connected to ${walletToConnect.adapter.name}`,
        { position: 'bottom' }
      );
      
      return true;
    } catch (error) {
      console.error('Wallet connection error:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect wallet');
      return false;
    }
  }, [wallets, select, closeWalletModal]);

  const clearWalletPersistence = useCallback(() => {
    localStorage.removeItem('walletAdapter');
    localStorage.removeItem('Phantom');
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
      closeWalletMenu();
      clearWalletPersistence();
      return true;
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      return false;
    }
  }, [disconnectWallet, closeWalletMenu, clearWalletPersistence]);

  // Show notification when wallet is connected, but only once per session
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    prevConnectedRef.current = connected;
    
    // Only show notification when transitioning from disconnected to connected
    // and notification hasn't been shown already
    if (connected && !wasConnected && selectedWallet && !notificationShownRef.current) {
      showNotification.success(
        'WALLET CONNECTED',
        `Successfully connected to ${selectedWallet.adapter.name}`,
        { position: 'bottom' }
      );
      notificationShownRef.current = true;
    }
  }, [connected, selectedWallet]);

  return {
    isConnected: connected,
    isConnecting: connecting,
    publicKey: publicKey?.toBase58(),
    wallet: selectedWallet ? {
      id: selectedWallet.adapter.name,
      name: selectedWallet.adapter.name,
      icon: selectedWallet.adapter.icon,
    } : null,
    availableWallets,
    isWalletModalOpen,
    isWalletMenuOpen,
    openWalletModal,
    closeWalletModal,
    toggleWalletMenu,
    closeWalletMenu,
    connect,
    disconnect,
    clearWalletPersistence,
    connectionError,
  };
}