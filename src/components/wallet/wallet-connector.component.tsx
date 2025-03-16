'use client';

import { useEffect } from 'react';
import { X, Info } from 'lucide-react';
import Image from 'next/image';
import { useWalletConnection } from '@/hooks/wallet/use-wallet-connection.hook';

interface WalletConnectorProps {
  onClose: () => void;
}

export function WalletConnector({ onClose }: WalletConnectorProps) {
  const { availableWallets, connect, connectionError } = useWalletConnection();

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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="w-full sm:max-w-md sm:rounded-xl bg-[#1B2131] border border-[#2D3548] shadow-xl overflow-auto max-h-[80vh]" 
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#2D3548]">
          <h2 className="text-base font-medium uppercase tracking-wider">Connect Wallet</h2>
          <button 
            onClick={onClose} 
            className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#2D3548]"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm uppercase tracking-wider text-[#94A3B8] mb-4">
            Connect to a Solana wallet to continue
          </p>
          
          {connectionError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
              <div className="flex items-center gap-2">
                <Info size={14} />
                <span className="uppercase tracking-wider">{connectionError}</span>
              </div>
            </div>
          )}
          
          {/* Wallet grid */}
          {availableWallets.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {availableWallets.map(wallet => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet.id)}
                  className="flex flex-col items-center justify-center gap-2 py-4 rounded-lg bg-[#202535] hover:bg-[#2D3548] transition"
                >
                  <div className="w-10 h-10 rounded-full bg-[#3D4663] flex items-center justify-center">
                    {wallet.icon ? (
                      <Image src={wallet.icon} alt={wallet.name} width={24} height={24} />
                    ) : (
                      <span className="text-lg">{wallet.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-xs uppercase tracking-wider">{wallet.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-[#94A3B8] mb-4 uppercase tracking-wider">
                No wallets available
              </p>
              
              <button
                onClick={() => window.open('https://phantom.app/', '_blank')}
                className="bg-[#AFD803] hover:bg-[#9DC503] text-[#111827] rounded-lg px-4 py-2 transition font-medium text-sm uppercase tracking-wider"
              >
                Get Phantom Wallet
              </button>
            </div>
          )}
          
          {/* Get a wallet section */}
          <div className="border-t border-[#2D3548] pt-4">
            <p className="text-sm uppercase tracking-wider text-[#94A3B8] mb-4">
              New to Solana?
            </p>
            <a 
              href="https://phantom.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-[#2D3548] hover:bg-[#3D4663] transition text-sm uppercase tracking-wider"
            >
              <div className="w-6 h-6 bg-[#3D4663] rounded-full flex items-center justify-center">P</div>
              <span>Get Phantom Wallet</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}