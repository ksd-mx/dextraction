'use client';

import { PropsWithChildren, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter, CoinbaseWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { config } from '@/config/app-config';
import { NotificationProvider } from '@/lib/notification';

export function AppProviders({ children }: PropsWithChildren) {
  // Setup the wallets that will be available for connection
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(), 
    new CoinbaseWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={config.solana.rpcUrl}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}