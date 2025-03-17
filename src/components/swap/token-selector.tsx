import { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { cn } from '@/utils/class-name.util';
import { useTokenStore } from '@/store/token-store';
import { TokenInfo } from '@/core/types/token.types';
import TokenRow from './token-row';

interface TokenSelectorProps {
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  excludeToken?: TokenInfo | null;
}

export default function TokenSelector({ onClose, onSelect, excludeToken }: TokenSelectorProps) {
  const { tokens, favoriteTokens, toggleFavorite, popularTokens, fetchAllTokens, isLoadingTokens } = useTokenStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'popular'>('all');
  
  // Fetch tokens if not already loaded
  useEffect(() => {
    if (tokens.length === 0 && !isLoadingTokens) {
      fetchAllTokens();
    }
  }, [tokens.length, fetchAllTokens, isLoadingTokens]);
  
  // Filter tokens based on search, excluded token, and active tab
  const filteredTokens = tokens.filter(token => {
    // Exclude the token that's already selected in the other input
    if (excludeToken && token.address === excludeToken.address) {
      return false;
    }
    
    // Filter based on active tab
    if (activeTab === 'favorites' && !favoriteTokens.includes(token.address)) {
      return false;
    }
    
    if (activeTab === 'popular' && !popularTokens.includes(token.address)) {
      return false;
    }
    
    // Filter based on search query
    if (!searchQuery) {
      return true;
    }
    
    const query = searchQuery.toLowerCase();
    return (
      token.name.toLowerCase().includes(query) ||
      token.symbol.toLowerCase().includes(query) ||
      token.address.toLowerCase() === query // Exact match for address
    );
  });
  
  // Sort the tokens by balance (non-zero first), then by favorites, then by popular, then by symbol
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    // First sort by whether the token has a balance > 0
    if (a.balance > 0 && b.balance === 0) return -1;
    if (a.balance === 0 && b.balance > 0) return 1;
    
    // Then by favorites
    const aIsFavorite = favoriteTokens.includes(a.address);
    const bIsFavorite = favoriteTokens.includes(b.address);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // Then by popular
    const aIsPopular = popularTokens.includes(a.address);
    const bIsPopular = popularTokens.includes(b.address);
    if (aIsPopular && !bIsPopular) return -1;
    if (!aIsPopular && bIsPopular) return 1;
    
    // Finally by symbol
    return a.symbol.localeCompare(b.symbol);
  });
  
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
          <h2 className="text-lg font-semibold uppercase tracking-wider">Select</h2>
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
        
        {/* Tabs */}
        <div className="flex border-b border-[#2D3548]">
          <button 
            onClick={() => setActiveTab('all')}
            className={cn(
              "flex-1 py-2 px-4 text-sm uppercase tracking-wider transition",
              activeTab === 'all' 
                ? "border-b-2 border-[#AFD803] text-white" 
                : "text-[#94A3B8] hover:text-white"
            )}
          >
            All Tokens
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={cn(
              "flex-1 py-2 px-4 text-sm uppercase tracking-wider transition",
              activeTab === 'favorites' 
                ? "border-b-2 border-[#AFD803] text-white" 
                : "text-[#94A3B8] hover:text-white"
            )}
          >
            Favorites
          </button>
          <button 
            onClick={() => setActiveTab('popular')}
            className={cn(
              "flex-1 py-2 px-4 text-sm uppercase tracking-wider transition",
              activeTab === 'popular' 
                ? "border-b-2 border-[#AFD803] text-white" 
                : "text-[#94A3B8] hover:text-white"
            )}
          >
            Popular
          </button>
        </div>
        
        {/* Token list */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingTokens ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-[#AFD803] mb-2" />
              <p className="text-sm text-[#94A3B8]">Loading...</p>
            </div>
          ) : sortedTokens.length > 0 ? (
            <div className="p-2">
              <div className="space-y-1">
                {sortedTokens.map(token => (
                  <TokenRow
                    key={token.address}
                    token={token}
                    isFavorite={favoriteTokens.includes(token.address)}
                    onSelect={() => onSelect(token)}
                    onToggleFavorite={() => toggleFavorite(token.address)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 px-4 text-center">
              <p className="text-[#94A3B8] mb-2 uppercase tracking-wider">
                No tokens found
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="bg-[#2D3548] hover:bg-[#3D4663] text-white rounded-lg px-4 py-2 text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}