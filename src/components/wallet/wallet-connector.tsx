'use client';

import { useEffect } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { X } from 'lucide-react';

interface WalletConnectorProps {
  onClose: () => void;
}

export default function WalletConnector({ onClose }: WalletConnectorProps) {
  const { availableWallets, connect, isConnecting, connectionError } = useWallet();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle wallet connection
  const handleConnect = async (walletId: string) => {
    const success = await connect(walletId);
    if (success) {
      onClose();
    }
  };

  // Modal backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl max-w-md w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
          <h2 className="text-lg font-semibold">Connect Wallet</h2>
          <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        {/* Modal body */}
        <div className="p-6">
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
            Connect to a Solana wallet to use DEXTRACTION.
          </p>
          
          {connectionError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
              {connectionError}
            </div>
          )}
          
          {/* Wallet list */}
          <div className="space-y-2">
            {availableWallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--accent))] transition"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[hsl(var(--card))] rounded-full flex items-center justify-center mr-3">
                    <span className="font-medium">{wallet.name.charAt(0)}</span>
                  </div>
                  <span className="font-medium">{wallet.name}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--muted-foreground))]">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}