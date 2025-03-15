'use client';

import { Star } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { TokenInfo } from '@/types/token';
import Image from 'next/image';

interface TokenRowProps {
  token: TokenInfo;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

export default function TokenRow({ token, isFavorite, onSelect, onToggleFavorite }: TokenRowProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 hover:bg-[#202535] rounded-lg cursor-pointer transition">
      <div className="flex items-center gap-3" onClick={onSelect}>
        {token.logoURI ? (
          <Image 
            src={token.logoURI} 
            alt={token.symbol} 
            width={32} 
            height={32} 
            className="rounded-full w-8 h-8"
            onError={(e) => {
              // On error, replace with a fallback
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=3D4663&color=fff&size=128`;
            }}
          />
        ) : (
          <div className="w-8 h-8 bg-[#3D4663] rounded-full flex items-center justify-center font-medium">
            {token.symbol.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-medium uppercase tracking-wider">{token.symbol}</div>
          <div className="text-xs text-[#94A3B8] truncate max-w-[120px]">{token.name}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div onClick={onSelect} className="text-right">
          {token.balance > 0 ? (
            <>
              <div className="font-medium uppercase tracking-wider">{formatNumber(token.balance, 4)}</div>
              <div className="text-xs text-[#94A3B8]">
                {token.price > 0 ? `${formatNumber(token.price * token.balance, 2)}` : '-'}
              </div>
            </>
          ) : (
            <div className="text-xs text-[#94A3B8]">No balance</div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="text-[#94A3B8] hover:text-[#AFD803] transition p-1"
        >
          <Star 
            size={16} 
            className={cn(
              isFavorite && "fill-[#AFD803] text-[#AFD803]"
            )} 
          />
        </button>
      </div>
    </div>
  );
}