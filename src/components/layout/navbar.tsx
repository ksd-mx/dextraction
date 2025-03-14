'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/use-wallet';
import WalletConnector from '@/components/wallet/wallet-connector';

export default function Navbar() {
  const { isConnected, wallet, publicKey, openWalletModal, closeWalletModal, isWalletModalOpen } = useWallet();

  return (
    <nav className="bg-[hsl(var(--background))]/80 backdrop-blur-md border-b border-[hsl(var(--border))]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and branding */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-xl font-bold text-white">DEXTRACTION</span>
            </Link>
          </div>
          
          {/* Wallet connection button */}
          <button
            onClick={openWalletModal}
            className="bg-[hsl(var(--primary))] text-white rounded-lg px-4 py-2 hover:bg-[hsl(var(--primary))]/90 transition font-medium"
          >
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
                  {wallet?.name.charAt(0)}
                </div>
                <span>{`${publicKey?.substring(0, 4)}...${publicKey?.substring(publicKey.length - 4)}`}</span>
              </div>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
      </div>
      
      {/* Wallet Modal */}
      {isWalletModalOpen && (
        <WalletConnector onClose={closeWalletModal} />
      )}
    </nav>
  );
}