'use client';

import { useState, useEffect } from 'react';
import { Settings, RefreshCw, ArrowRight } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { cn } from '@/lib/utils';
import SettingsModal from '@/components/swap/settings-modal';
import { useSwapStore } from '@/store/swap-store';
import { useTokenStore } from '@/store/token-store';
import { TokenInfo } from '@/types/token';
import TokenSelector from '@/components/swap/token-selector';
import TokenAmountInput from '@/components/swap/token-amount-input';
import SwapStats from '@/components/swap/swap-stats';

export default function SwapWidget() {
  const { isConnected, openWalletModal, publicKey, signTransaction } = useWallet();
  const { fetchTokenBalances, fetchAllTokens, tokens, isLoadingTokens } = useTokenStore();
  const { 
    fromToken, 
    toToken, 
    fromAmount, 
    setFromToken, 
    setToToken, 
    setFromAmount, 
    swapTokens,
    fetchPrice,
    estimatedOutput,
    priceImpact,
    isLoading,
    setConnected,
    handleSwap,
    slippage,
    initializeDefaultTokens
  } = useSwapStore();
  
  // Fetch token list on initial load
  useEffect(() => {
    if (tokens.length === 0 && !isLoadingTokens) {
      fetchAllTokens();
    }
  }, [tokens.length, fetchAllTokens, isLoadingTokens]);
  
  // Sync wallet connection state with swap store
  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);
  
  // Initialize default token selections after tokens are loaded
  useEffect(() => {
    if (tokens.length > 0 && !fromToken && !toToken) {
      initializeDefaultTokens();
    }
  }, [tokens, fromToken, toToken, initializeDefaultTokens]);

  // Fetch token balances when wallet is connected
  useEffect(() => {
    if (isConnected && publicKey) {
      fetchTokenBalances(publicKey);
    }
  }, [isConnected, publicKey, fetchTokenBalances]);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFromSelectorOpen, setIsFromSelectorOpen] = useState(false);
  const [isToSelectorOpen, setIsToSelectorOpen] = useState(false);
  
  // Fetch price when input changes
  useEffect(() => {
    if (fromToken && toToken && fromAmount > 0) {
      fetchPrice();
    }
  }, [fromToken, toToken, fromAmount, fetchPrice]);
  
  const handleSwapClick = async () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    const success = await handleSwap({ publicKey, signTransaction });
    if (success) {
      // Refresh token balances after swap
      if (publicKey) {
        fetchTokenBalances(publicKey);
      }
    }
  };

  // Handle refresh balances button
  const handleRefreshBalances = () => {
    if (isConnected && publicKey) {
      fetchTokenBalances(publicKey);
    }
  };
  
  const hasError = priceImpact > 15;
  
  return (
    <div className="jupiter-card overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2D3548]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold uppercase tracking-wider">Swap</h2>
        </div>
        
        {/* Slippage and settings buttons */}
        <div className="flex items-center gap-2">
          <button className="jupiter-tag flex items-center uppercase tracking-wider">
            Slippage: {slippage}%
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2D3548] transition hover:cursor-pointer"
          >
            <Settings size={18} className="text-[#94A3B8]" />
          </button>
          <button 
            onClick={handleRefreshBalances}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2D3548] transition hover:cursor-pointer"
          >
            <RefreshCw size={18} className="text-[#94A3B8]" />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-1">
        {/* Selling section */}
        <TokenAmountInput 
          label="You Pay"
          token={fromToken}
          amount={fromAmount}
          isConnected={isConnected}
          isLoadingTokens={isLoadingTokens}
          showBalanceButtons={true}
          estimatedValue={fromToken?.price ? fromToken.price * fromAmount : undefined}
          onTokenSelect={() => setIsFromSelectorOpen(true)}
          onAmountChange={setFromAmount}
          onMaxClick={() => fromToken && setFromAmount(fromToken.balance)}
          onHalfClick={() => fromToken && setFromAmount(fromToken.balance / 2)}
        />
        
        {/* Swap direction button */}
        <div className="flex justify-center relative">
          <div className="h-px w-full bg-[#2D3548] absolute top-1/2 transform -translate-y-1/2"></div>
           <button
            onClick={swapTokens}
            className="w-10 h-10 bg-[#1A1F2E] rounded-full border border-[#2D3548] flex items-center justify-center hover:border-[#AFD803] hover:text-[#AFD803] text-white transition z-10 cursor-pointer"
            aria-label="Swap tokens"
          >
            <svg 
              width="21" 
              height="22" 
              viewBox="0 0 21 22" 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6.51043 7.47998V14.99H7.77043V7.47998L9.66043 9.36998L10.5505 8.47994L7.5859 5.51453C7.3398 5.26925 6.94114 5.26925 6.69504 5.51453L3.73047 8.47994L4.62051 9.36998L6.51043 7.47998Z" fill="currentColor"></path>
              <path d="M14.4902 14.52V7.01001H13.2302V14.52L11.3402 12.63L10.4502 13.5201L13.4148 16.4855C13.6609 16.7308 14.0595 16.7308 14.3056 16.4855L17.2702 13.5201L16.3802 12.63L14.4902 14.52Z" fill="currentColor"></path>
            </svg>
          </button>
        </div>
        
        {/* Buying section */}
        <TokenAmountInput 
          label="You Receive"
          token={toToken}
          amount={estimatedOutput}
          isConnected={isConnected}
          isLoadingTokens={isLoadingTokens}
          isOutput={true}
          isLoading={isLoading}
          estimatedValue={toToken?.price ? toToken.price * estimatedOutput : undefined}
          onTokenSelect={() => setIsToSelectorOpen(true)}
        />
        
        {/* Price and impact info */}
        <SwapStats 
          fromToken={fromToken}
          toToken={toToken}
          fromAmount={fromAmount}
          estimatedOutput={estimatedOutput}
          priceImpact={priceImpact}
          slippage={slippage}
          onSwapDirectionChange={swapTokens}
        />
        
        {/* Swap button */}
        <button
          onClick={handleSwapClick}
          disabled={!isConnected || !fromToken || !toToken || fromAmount <= 0 || estimatedOutput <= 0 || hasError || isLoading || (isConnected && fromToken && fromToken.balance < fromAmount)}
          className={cn(
            "w-full py-4 px-4 rounded-lg font-semibold text-lg transition mt-3 uppercase tracking-wider",
            isConnected 
              ? (!fromToken || !toToken || fromAmount <= 0 || isLoading)
                ? "bg-[#566040] text-white opacity-70 cursor-not-allowed"
                : (fromToken && fromToken.balance < fromAmount)
                  ? "bg-[#566040] text-white opacity-70 cursor-not-allowed" 
                  : "jupiter-button" 
              : "jupiter-button",
            hasError && "opacity-50 cursor-not-allowed"
          )}
        >
          {!isConnected 
            ? "Connect Wallet" 
            : isLoading
              ? "Calculating..."
              : (fromToken && fromToken.balance < fromAmount)
                ? "Insufficient Balance"
                : hasError 
                  ? "Price Impact Too High" 
                  : "Swap"}
        </button>
      </div>
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
      
      {/* Token Selectors */}
      {isFromSelectorOpen && (
        <TokenSelector 
          onClose={() => setIsFromSelectorOpen(false)} 
          onSelect={(token) => {
            setFromToken(token);
            setIsFromSelectorOpen(false);
          }}
          excludeToken={toToken as TokenInfo}
        />
      )}
      
      {isToSelectorOpen && (
        <TokenSelector 
          onClose={() => setIsToSelectorOpen(false)} 
          onSelect={(token) => {
            setToToken(token);
            setIsToSelectorOpen(false);
          }}
          excludeToken={fromToken as TokenInfo}
        />
      )}
    </div>
  );
}