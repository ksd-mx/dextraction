'use client';

import { RefreshCw, Info } from 'lucide-react';
import { cn } from '@/utils/class-name.util';
import { formatNumber } from '@/utils/format-number.util';
import { TokenInfo } from '@/core/types/token.types';

interface SwapStatsProps {
  fromToken: TokenInfo | null;
  toToken: TokenInfo | null;
  fromAmount: number;
  estimatedOutput: number;
  priceImpact: number;
  slippage: number;
  onSwapDirectionChange: () => void;
}

export default function SwapStats({
  fromToken,
  toToken,
  fromAmount,
  estimatedOutput,
  priceImpact,
  slippage,
  onSwapDirectionChange
}: SwapStatsProps) {
  if (!fromToken || !toToken || fromAmount <= 0 || estimatedOutput <= 0) {
    return null;
  }

  const hasError = priceImpact > 15;
  const hasWarning = priceImpact > 5 && priceImpact <= 15;

  return (
    <div className="bg-[#1A1F2E] rounded-lg p-3 space-y-1 mt-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-[#94A3B8] uppercase tracking-wider">Rate</span>
        <div className="flex items-center">
          <span className="text-sm uppercase tracking-wider">
            1 {fromToken.symbol} = {formatNumber(estimatedOutput / fromAmount, 6)} {toToken.symbol}
          </span>
          <button onClick={onSwapDirectionChange} className="ml-1 text-[#94A3B8] hover:text-white">
            <RefreshCw size={14} />
          </button>
        </div>
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
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-[#94A3B8] uppercase tracking-wider">Powered By</span>
        <span className="text-sm uppercase tracking-wider text-[#94A3B8]">Jupiter</span>
      </div>
    </div>
  );
}