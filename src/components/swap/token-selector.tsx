'use client';

import { useState, useEffect } from 'react';
import { X, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTokenStore } from '@/store/token-store';
import { Token } from '@/types/token';

interface TokenSelectorProps {
  onClose: () => void;
  onSelect: (token: Token) => void;
  excludeToken?: Token | null;
}

export default function TokenSelector({ onClose, onSelect, excludeToken }: TokenSelectorProps) {
  const { tokens, favoriteTokens, toggleFavorite } = useTokenStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter tokens based on search and excluded token
  const filteredTokens = tokens.filter(token => {
    if (excludeToken && token.symbol === excludeToken.symbol) {
      return false;
    }
    
    if (!searchQuery) {
      return true;
    }
    
    const query = searchQuery.toLowerCase();
    return (
      token.name.toLowerCase().includes(query) ||
      token.symbol.toLowerCase().includes(query)
    );
  });
  
  // Separate favorite tokens for display
  const favoritedTokens = filteredTokens.filter(token => 
    favoriteTokens.includes(token.symbol)
  );
  
  const otherTokens = filteredTokens.filter(token => 
    !favoriteTokens.includes(token.symbol)
  );
  
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
  
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="jupiter-card max-w-md w-full max-h-[80vh] flex flex-col shadow-xl shadow-black/20"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2D3548]">
          <h2 className="text-lg font-semibold uppercase tracking-wider">Select a token</h2>
          <button 
            onClick={onClose} 
            className="text-[#94A3B8] hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search input */}
        <div className="p-4 border-b border-[#2D3548]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-[#94A3B8]" />
            </div>
            <input
              type="text"
              placeholder="Search by name or symbol"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#202535] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#AFD803] focus:bg-[#2D3548] transition text-white"
            />
          </div>
        </div>
        
        {/* Token list */}
        <div className="flex-1 overflow-y-auto">
          {/* Favorite tokens section */}
          {favoritedTokens.length > 0 && (
            <div className="p-2">
              <h3 className="px-2 py-1 text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Favorites</h3>
              <div className="space-y-1">
                {favoritedTokens.map(token => (
                  <TokenRow
                    key={token.symbol}
                    token={token}
                    isFavorite={true}
                    onSelect={() => onSelect(token)}
                    onToggleFavorite={() => toggleFavorite(token.symbol)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* All tokens */}
          <div className="p-2">
            {favoritedTokens.length > 0 && (
              <h3 className="px-2 py-1 text-xs text-[#94A3B8] font-medium uppercase tracking-wider">All tokens</h3>
            )}
            <div className="space-y-1">
              {otherTokens.map(token => (
                <TokenRow
                  key={token.symbol}
                  token={token}
                  isFavorite={favoriteTokens.includes(token.symbol)}
                  onSelect={() => onSelect(token)}
                  onToggleFavorite={() => toggleFavorite(token.symbol)}
                />
              ))}
              
              {filteredTokens.length === 0 && (
                <div className="px-2 py-4 text-center text-[#94A3B8] uppercase tracking-wider">
                  No tokens found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TokenRowProps {
  token: Token;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

function TokenRow({ token, isFavorite, onSelect, onToggleFavorite }: TokenRowProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 hover:bg-[#202535] rounded-lg cursor-pointer transition">
      <div className="flex items-center gap-3" onClick={onSelect}>
        <div className="w-8 h-8 bg-[#3D4663] rounded-full flex items-center justify-center font-medium">
          {token.symbol.charAt(0)}
        </div>
        <div>
          <div className="font-medium uppercase tracking-wider">{token.symbol}</div>
          <div className="text-xs text-[#94A3B8]">{token.name}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div onClick={onSelect} className="text-right">
          <div className="font-medium uppercase tracking-wider">{token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div className="text-xs text-[#94A3B8]">
            ${(token.price * token.balance).toFixed(2)}
          </div>
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