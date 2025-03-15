'use client';

import { useState, useEffect } from 'react';
import { Settings, RefreshCw, Info } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { cn, formatNumber } from '@/lib/utils';
import SettingsModal from '@/components/swap/settings-modal';
import TokenSelector from '@/components/swap/token-selector';
import { useSwapStore } from '@/store/swap-store';
import { useTokenStore } from '@/store/token-store';

export default function SwapWidget() {
  const { isConnected, openWalletModal, publicKey } = useWallet();
  const { fetchTokenBalances } = useTokenStore();
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
  
  // Sync wallet connection state with swap store
  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);
  
  // Initialize default token selections (SOL -> USDC)
  useEffect(() => {
    initializeDefaultTokens();
  }, [initializeDefaultTokens]);

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
    
    const success = await handleSwap();
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
  const hasWarning = priceImpact > 5 && priceImpact <= 15;
  
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
        <div className="bg-[#1A1F2E] rounded-lg p-4">
          <div className="flex justify-between mb-3">
            <span className="text-sm font-medium uppercase tracking-wider">Selling</span>
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 bg-[#2D3548] rounded-md text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-[#3D4663] transition uppercase tracking-wider hover:cursor-pointer"
                onClick={() => fromToken && setFromAmount(fromToken.balance / 2)}
                disabled={!isConnected || !fromToken || fromToken.balance <= 0}
              >
                HALF
              </button>
              <button 
                className="px-3 py-1 bg-[#2D3548] rounded-md text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-[#3D4663] transition uppercase tracking-wider hover:cursor-pointer"
                onClick={() => fromToken && setFromAmount(fromToken.balance)}
                disabled={!isConnected || !fromToken || fromToken.balance <= 0}
              >
                MAX
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setIsFromSelectorOpen(true)}
              className="token-button"
            >
              {fromToken ? (
                <>
                  <div className="token-icon">
                    {fromToken.symbol.charAt(0)}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold uppercase tracking-wider">{fromToken.symbol}</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#94A3B8] ml-1">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </>
              ) : (
                <>
                  <div className="token-icon">
                    $
                  </div>
                  <span className="font-medium uppercase tracking-wider">Select token</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#94A3B8] ml-1">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </>
              )}
            </button>
            
            <input
              type="number"
              value={fromAmount || ''}
              onChange={(e) => setFromAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="jupiter-input text-right text-2xl md:text-4xl no-spinner"
            />
          </div>
          
          {fromToken && (
            <div className="text-right text-sm text-[#94A3B8] mt-1 uppercase tracking-wider">
              Balance: {isConnected ? formatNumber(fromToken.balance, 4) : '0'} {fromToken.symbol}
            </div>
          )}
        </div>
        
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
        <div className="bg-[#1A1F2E] rounded-lg p-4">
          <div className="flex justify-between mb-3">
            <span className="text-sm font-medium uppercase tracking-wider">Buying</span>
            {toToken && (
              <span className="text-sm text-[#94A3B8] uppercase tracking-wider">
                Balance: {isConnected ? formatNumber(toToken.balance, 4) : '0'} {toToken.symbol}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setIsToSelectorOpen(true)}
              className="token-button"
            >
              {toToken ? (
                <>
                  <div className="token-icon">
                    {toToken.symbol.charAt(0)}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold uppercase tracking-wider">{toToken.symbol}</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#94A3B8] ml-1">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </>
              ) : (
                <>
                  <div className="token-icon">
                    ?
                  </div>
                  <span className="font-medium uppercase tracking-wider">Select token</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#94A3B8] ml-1">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </>
              )}
            </button>
            
            <div className="text-right text-2xl md:text-4xl">
              {estimatedOutput ? formatNumber(estimatedOutput, 6) : '0.00'}
            </div>
          </div>
          
          {toToken && fromToken && fromAmount > 0 && (
            <div className="text-right text-sm text-[#94A3B8] mt-1 uppercase tracking-wider">
              ≈ ${(estimatedOutput * toToken.price).toFixed(2)}
            </div>
          )}
        </div>
        
        {/* Price and impact info */}
        {fromToken && toToken && fromAmount > 0 && estimatedOutput > 0 && (
          <div className="bg-[#1A1F2E] rounded-lg p-3 space-y-1 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#94A3B8] uppercase tracking-wider">Price</span>
              <span className="text-sm uppercase tracking-wider">
                1 {fromToken.symbol} = {formatNumber(estimatedOutput / fromAmount, 6)} {toToken.symbol}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#94A3B8] uppercase tracking-wider">Price Impact</span>
                <Info size={12} className="text-[#94A3B8]" />
              </div>
              <span className={cn(
                "text-sm uppercase tracking-wider", 
                hasError ? "text-red-500" : hasWarning ? "text-yellow-500" : "text-green-500"
              )}>
                {formatNumber(priceImpact, 2)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#94A3B8] uppercase tracking-wider">Slippage Tolerance</span>
              <span className="text-sm uppercase tracking-wider">{slippage}%</span>
            </div>
          </div>
        )}
        
        {/* Swap button */}
        <button
          onClick={handleSwapClick}
          disabled={!isConnected || !fromToken || !toToken || fromAmount <= 0 || estimatedOutput <= 0 || hasError || (isConnected && fromToken && fromToken.balance < fromAmount)}
          className={cn(
            "w-full py-4 px-4 rounded-lg font-semibold text-lg transition mt-3 uppercase tracking-wider",
            isConnected 
              ? (!fromToken || !toToken || fromAmount <= 0)
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
            : (fromToken && fromToken.balance < fromAmount)
              ? "Insufficient Balance"
              : hasError 
                ? "Price Impact Too High" 
                : isLoading 
                  ? "Calculating..." 
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
          excludeToken={toToken}
        />
      )}
      
      {isToSelectorOpen && (
        <TokenSelector 
          onClose={() => setIsToSelectorOpen(false)} 
          onSelect={(token) => {
            setToToken(token);
            setIsToSelectorOpen(false);
          }}
          excludeToken={fromToken}
        />
      )}
    </div>
  );
}