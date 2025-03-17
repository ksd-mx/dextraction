'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/use-wallet';
import WalletConnector from '@/components/wallet/wallet-connector';
import ComingSoonModal from '@/components/ui/coming-soon-modal';
import SettingsModal from '@/components/swap/settings-modal';
import { cn } from '@/utils/class-name.util';
import { Settings, ChevronDown, Copy, ExternalLink, Power, ChevronUp } from 'lucide-react';
import { config } from '@/utils/config';
import { showNotification } from '@/store/notification-store';
import Image from 'next/image';

export default function Navbar() {
  const pathname = usePathname();
  const { 
    isConnected, 
    wallet, 
    publicKey, 
    isWalletModalOpen,
    isWalletMenuOpen,
    openWalletModal, 
    closeWalletModal, 
    toggleWalletMenu,
    closeWalletMenu,
    disconnect
  } = useWallet();
  
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const [featureName, setFeatureName] = useState('');
  const walletMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'SWAP', path: '/', enabled: true },
    { name: 'LIQUIDITY', path: '/liquidity', enabled: false },
    { name: 'STAKING', path: '/staking', enabled: false },
    { name: 'BRIDGE', path: '/bridge', enabled: false },
  ];

  const showComingSoon = (name: string) => {
    setFeatureName(name);
    setIsComingSoonModalOpen(true);
  };
  
  // Close wallet menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        closeWalletMenu();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeWalletMenu]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Handle copy wallet address
  const copyWalletAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      showNotification.success(
        'ADDRESS COPIED',
        'Wallet address copied to clipboard'
      );
      closeWalletMenu();
    }
  };
  
  // Handle disconnect
  const handleDisconnect = async () => {
    await disconnect();
    showNotification.info(
      'WALLET DISCONNECTED',
      'Your wallet has been disconnected',
      { position: 'bottom' }
    );
  };

  return (
    <>
      <nav className="bg-transparent backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and branding */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#AFD803] rounded-full flex items-center justify-center">
                  <span className="text-[#111827] font-bold text-xl">D</span>
                </div>
                <span className="text-l font-bold text-white uppercase tracking-wider hidden sm:block">
                  {config.app.name}
                </span>
              </Link>
            </div>
            
            {/* Navigation links */}
            <div className="hidden md:flex items-center space-x-1 ml-6">
              {navItems.map((item) => (
                <div key={item.name}>
                  {item.enabled ? (
                    <Link
                      href={item.path}
                      className={cn(
                        "px-4 py-2 rounded-lg font-medium transition text-sm tracking-wider",
                        pathname === item.path
                          ? "bg-[#202535] text-white"
                          : "text-[#94A3B8] hover:text-white hover:bg-[#202535]"
                      )}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <Link
                      href="#" // {item.path}
                      onClick={() => showComingSoon(item.name)}
                      className="px-4 py-2 rounded-lg font-medium text-[#94A3B8] hover:text-white hover:bg-[#202535] transition text-sm tracking-wider"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            
            {/* Search and wallet section */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#202535] hover:cursor-pointer">
                <Settings size={20} />
              </button>
              
              {/* Wallet connection button */}
              {isConnected ? (
                <div className="relative">
                  <button
                    onClick={toggleWalletMenu}
                    className="rounded-lg px-4 py-2 transition font-medium bg-[#202535] hover:bg-[#2D3548] text-white text-small tracking-wider"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-[#3D4663] rounded-full flex items-center justify-center text-xs">
                        {wallet?.icon ? (
                          <Image src={wallet.icon} alt={wallet.name} width={16} height={16} className="w-4 h-4" />
                        ) : (
                          wallet?.name.charAt(0)
                        )}
                      </div>
                      <span>{publicKey?.substring(0, 4)}...{publicKey?.substring(publicKey.length - 4)}</span>
                      {isWalletMenuOpen ? (
                        <ChevronUp size={14} className="text-[#94A3B8]" />
                      ) : (
                        <ChevronDown size={14} className="text-[#94A3B8]" />
                      )}
                    </div>
                  </button>
                  
                  {/* Wallet Menu */}
                  {isWalletMenuOpen && (
                    <div 
                      ref={walletMenuRef}
                      className="absolute right-0 mt-2 w-60 wallet-menu z-50"
                    >
                      <div className="wallet-menu-item text-small tracking-wider">
                        <div className="w-6 h-6 bg-[#3D4663] rounded-full flex items-center justify-center text-xs">
                          {wallet?.icon ? (
                            <Image src={wallet.icon} alt={wallet.name} width={16} height={16} className="w-4 h-4" />
                          ) : (
                            wallet?.name.charAt(0)
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white uppercase">{wallet?.name}</span>
                          <span className="text-[#94A3B8] text-xs">{publicKey?.substring(0, 6)}...{publicKey?.substring(publicKey.length - 6)}</span>
                        </div>
                      </div>
                      
                      <div className="wallet-menu-divider" />
                      
                      <button 
                        className="wallet-menu-item w-full text-left text-small tracking-wider text-[#94A3B8] hover:text-white" 
                        onClick={copyWalletAddress}
                      >
                        <Copy size={16} />
                        <span>COPY ADDRESS</span>
                      </button>
                      
                      <button 
                        className="wallet-menu-item w-full text-left text-small tracking-wider text-[#94A3B8] hover:text-white"
                        onClick={() => {
                          window.open(`https://explorer.solana.com/address/${publicKey}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'testnet'}`, '_blank');
                        }}
                      >
                        <ExternalLink size={16} />
                        <span>VIEW ON EXPLORER</span>
                      </button>
                      
                      <div className="wallet-menu-divider" />
                      
                      <button 
                        className="wallet-menu-item w-full text-left text-small tracking-wider text-red-400 hover:text-red-300"
                        onClick={handleDisconnect}
                      >
                        <Power size={16} />
                        <span>DISCONNECT</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={openWalletModal}
                  className="bg-[#AFD803] hover:bg-[#9DC503] text-[#111827] rounded-lg px-4 py-2 transition font-medium text-small tracking-wider hover:cursor-pointer"
                >
                  CONNECT WALLET
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Portal for Modals - Moved outside the nav element to fix positioning */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
      
      {isWalletModalOpen && (
        <WalletConnector onClose={closeWalletModal} />
      )}
      
      {isComingSoonModalOpen && (
        <ComingSoonModal 
          featureName={featureName} 
          onClose={() => setIsComingSoonModalOpen(false)} 
        />
      )}
    </>
  );
}