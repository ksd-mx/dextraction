// src/hooks/wallet/use-wallet-adapter.hook.ts
import { useMemo, useEffect, useState } from 'react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  CoinbaseWalletAdapter,
  MathWalletAdapter,
  CloverWalletAdapter,
  TokenPocketWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletReadyState, Adapter } from '@solana/wallet-adapter-base';
import { Wallet } from '@/types/wallet.types';
import { config } from '@/config/app-config';

export function useWalletAdapter() {
  const [detectedWallets, setDetectedWallets] = useState<Wallet[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);

  // Initialize wallet adapters
  const walletAdapters = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
    new CloverWalletAdapter(),
    new TorusWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new MathWalletAdapter(),
    new TokenPocketWalletAdapter(),
  ], []);

  // Map adapters to our wallet interface
  const mapAdapter = (adapter: Adapter): Wallet => ({
    id: adapter.name,
    name: adapter.name,
    icon: adapter.icon,
  });

  // Filter for only available wallets
  const getAvailableWallets = (adapters: Adapter[]): Wallet[] => {
    return adapters
      .filter(adapter => adapter.readyState === WalletReadyState.Installed || adapter.readyState === WalletReadyState.Loadable)
      .map(mapAdapter);
  };

  // Configure the connection endpoint
  const endpoint = useMemo(() => config.solana.rpcUrl || 'https://api.mainnet-beta.solana.com', []);

  // Wait for wallet detection
  useEffect(() => {
    const detectWallets = async () => {
      // Give wallets time to detect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Detect available wallets
      const available = getAvailableWallets(walletAdapters);
      setDetectedWallets(available);
      setIsDetecting(false);
    };
    
    detectWallets();
  }, [walletAdapters]);
  
  // Get all adapter instances by name
  const getWalletAdapter = (walletName: string): Adapter | undefined => {
    return walletAdapters.find(adapter => adapter.name === walletName);
  };

  return {
    walletAdapters,
    detectedWallets,
    isDetecting,
    endpoint,
    getWalletAdapter
  };
}