// src/providers/app.providers.tsx
'use client';

import { PropsWithChildren } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { SOLANA_RPC_URL } from '@/constants/app.constants';
import { NotificationProvider } from '@/lib/notification';

export function AppProviders({ children }: PropsWithChildren) {
  // Setup the wallets that will be available for connection
  const wallets = [
    new PhantomWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}