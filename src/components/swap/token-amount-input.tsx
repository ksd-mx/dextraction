'use client';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { formatNumber } from '@/lib/utils';
import { TokenInfo } from '@/types/token';

interface TokenAmountInputProps {
  label: string;
  token: TokenInfo | null;
  amount: number | string;
  balance?: number;
  isConnected: boolean;
  isLoadingTokens: boolean;
  showBalanceButtons?: boolean;
  estimatedValue?: number;
  isOutput?: boolean;
  isLoading?: boolean;
  onTokenSelect: () => void;
  onAmountChange?: (amount: number) => void;
  onMaxClick?: () => void;
  onHalfClick?: () => void;
}

export default function TokenAmountInput({
  label,
  token,
  amount,
  balance,
  isConnected,
  isLoadingTokens,
  showBalanceButtons = false,
  estimatedValue,
  isOutput = false,
  isLoading = false,
  onTokenSelect,
  onAmountChange,
  onMaxClick,
  onHalfClick,
}: TokenAmountInputProps) {
  return (
    <div className="bg-[#1A1F2E] rounded-lg p-4">
      <div className="flex justify-between mb-3">
        <span className="text-sm font-medium uppercase tracking-wider">{label}</span>
        {showBalanceButtons && (
          <div className="flex items-center gap-2">
            <button 
              className="px-3 py-1 bg-[#2D3548] rounded-md text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-[#3D4663] transition uppercase tracking-wider hover:cursor-pointer"
              onClick={onHalfClick}
              disabled={!isConnected || !token || !!(balance && balance <= 0)}
            >
              HALF
            </button>
            <button 
              className="px-3 py-1 bg-[#2D3548] rounded-md text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-[#3D4663] transition uppercase tracking-wider hover:cursor-pointer"
              onClick={onMaxClick}
              disabled={!isConnected || !token || !!(balance && balance <= 0)}
            >
              MAX
            </button>
          </div>
        )}
        {token && !showBalanceButtons && (
          <span className="text-sm text-[#94A3B8] uppercase tracking-wider">
            Balance: {isConnected ? formatNumber(token.balance, 6) : '0'} {token.symbol}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex-shrink-0 min-w-[140px]">
          <button
            onClick={onTokenSelect}
            className="token-button flex items-center bg-[#202535] hover:bg-[#2D3548] rounded-lg py-2 px-3 transition"
            disabled={isLoadingTokens}
          >
            {isLoadingTokens ? (
              <div className="flex items-center">
                <Loader2 size={16} className="text-[#94A3B8] animate-spin mr-2" />
                <span className="font-medium uppercase tracking-wider">Loading...</span>
              </div>
            ) : token ? (
              <>
                <div className="flex items-center mr-1">
                  {token.logoURI ? (
                    <Image 
                      src={token.logoURI} 
                      alt={token.symbol} 
                      width={24} 
                      height={24} 
                      className="rounded-full w-6 h-6 mr-2"
                      onError={(e) => {
                        // On error, replace with a fallback
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=3D4663&color=fff&size=128`;
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 bg-[#3D4663] rounded-full flex items-center justify-center text-xs mr-2">
                      {token.symbol.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold text-sm uppercase tracking-wider">{token.symbol}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center mr-1">
                  <div className="w-6 h-6 bg-[#3D4663] rounded-full flex items-center justify-center text-xs mr-2">
                    {isOutput ? '?' : '$'}
                  </div>
                  <span className="font-medium uppercase tracking-wider">Select</span>
                </div>
              </>
            )}
            <div className="w-4 h-4 flex-shrink-0">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24"
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-[#94A3B8]"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </div>
          </button>
        </div>
        
        {isOutput ? (
          <div className="flex items-center">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 size={24} className="text-[#94A3B8] animate-spin mr-2" />
                <span className="text-lg text-[#94A3B8]">Calculating...</span>
              </div>
            ) : (
              <div className="text-right text-2xl md:text-4xl">
                {amount ? formatNumber(Number(amount), 6) : '0.00'}
              </div>
            )}
          </div>
        ) : (
          <input
            type="number"
            value={amount || '0'}
            onChange={(e) => onAmountChange && onAmountChange(parseFloat(e.target.value) || 0)}
            className="jupiter-input text-right text-2xl md:text-4xl no-spinner"
          />
        )}
      </div>
      
      {token && estimatedValue !== undefined && (
        <div className="text-right text-sm text-[#94A3B8] mt-1 uppercase tracking-wider">
          {Number(amount) > 0 ? (
            <span>≈ ${formatNumber(estimatedValue, 2)}</span>
          ) : null}
        </div>
      )}
      
      {token && showBalanceButtons && (
        <div className="text-right text-sm text-[#94A3B8] mt-1 uppercase tracking-wider">
          Balance: {isConnected ? formatNumber(token.balance, 6) : '0'} {token.symbol}
          {token.price > 0 && Number(amount) > 0 && (
            <span className="ml-2">(≈${formatNumber(token.price * Number(amount), 2)})</span>
          )}
        </div>
      )}
    </div>
  );
}