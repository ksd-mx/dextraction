'use client';

import React, { FC, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
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
import { config } from '@/utils/config';

export const WalletConnectionProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  // You can also provide a custom RPC endpoint
  const endpoint = config.solana.rpcUrl || 'https://api.testnet.solana.com';

  // Support a wide range of wallets to ensure users can connect with their preferred wallet
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
      new CloverWalletAdapter(),
      new TorusWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new MathWalletAdapter(),
      new TokenPocketWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};