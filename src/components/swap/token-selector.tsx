import { useState, useEffect, useCallback, memo } from 'react';
import { X, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTokenStore } from '@/store/token-store';
import { TokenInfo } from '@/types/token';
import TokenRow from './token-row';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface TokenSelectorProps {
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  excludeToken?: TokenInfo | null;
}

// Memo-ized TokenRow for maximum performance
const MemoizedTokenRow = memo(TokenRow);

// Define the row renderer for the virtualized list
interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    tokens: TokenInfo[];
    favoriteTokens: string[];
    toggleFavorite: (address: string) => void;
    onSelect: (token: TokenInfo) => void;
  };
}

const Row = ({ index, style, data }: RowProps) => {
  const { tokens, favoriteTokens, toggleFavorite, onSelect } = data;
  const token = tokens[index];

  if (!token) return null;

  return (
    <div style={style}>
      <MemoizedTokenRow
        token={token}
        isFavorite={favoriteTokens.includes(token.address)}
        onSelect={() => onSelect(token)}
        onToggleFavorite={() => toggleFavorite(token.address)}
      />
    </div>
  );
};

export default function TokenSelector({ onClose, onSelect, excludeToken }: TokenSelectorProps) {
  const { 
    tokens, 
    filteredTokens,
    favoriteTokens, 
    toggleFavorite, 
    popularTokens, 
    fetchAllTokens, 
    isLoadingTokens,
    hasTokenError,
    resetErrorState,
    setSearchQuery,
    searchQuery
  } = useTokenStore();
  
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'popular'>('all');
  const [retryCount, setRetryCount] = useState(0);
  
  // Fetch tokens if not already loaded
  useEffect(() => {
    if (tokens.length === 0 && !isLoadingTokens) {
      fetchAllTokens().catch(console.error);
    }
  }, [tokens.length, fetchAllTokens, isLoadingTokens]);
  
  // Filter tokens based on active tab
  const displayTokens = filteredTokens.filter(token => {
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
    
    return true;
  });
  
  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);
  
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
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);
  
  // Handle token selection with memoization
  const handleSelect = useCallback((token: TokenInfo) => {
    onSelect(token);
  }, [onSelect]);

  // Handle retry token fetch
  const handleRetryFetch = useCallback(() => {
    resetErrorState();
    setRetryCount(prev => prev + 1);
    fetchAllTokens().catch(console.error);
  }, [fetchAllTokens, resetErrorState]);

  // Data for virtualized list
  const listData = {
    tokens: displayTokens,
    favoriteTokens,
    toggleFavorite,
    onSelect: handleSelect
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
          <h2 className="text-lg font-semibold uppercase tracking-wider">Select Token</h2>
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
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-[#202535] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#AFD803] focus:bg-[#2D3548] transition text-white"
              disabled={isLoadingTokens || hasTokenError}
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
        <div className="flex-1 overflow-hidden">
          {isLoadingTokens ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-[#AFD803] mb-2" />
              <p className="text-sm text-[#94A3B8]">Loading tokens...</p>
            </div>
          ) : hasTokenError ? (
            <div className="flex flex-col items-center justify-center h-40 p-4">
              <AlertCircle size={24} className="text-red-500 mb-2" />
              <p className="text-sm text-red-400 mb-4 text-center">
                Error loading tokens. Please try again later.
              </p>
              <button 
                onClick={handleRetryFetch}
                className="flex items-center gap-2 bg-[#2D3548] hover:bg-[#3D4663] text-white rounded-lg px-4 py-2 text-sm"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          ) : displayTokens.length > 0 ? (
            <div className="h-full">
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    width={width}
                    itemCount={displayTokens.length}
                    itemSize={60} // Adjust based on your TokenRow height
                    itemData={listData}
                  >
                    {Row}
                  </List>
                )}
              </AutoSizer>
            </div>
          ) : (
            <div className="py-10 px-4 text-center">
              {activeTab === 'favorites' && favoriteTokens.length === 0 ? (
                <p className="text-[#94A3B8] mb-2 uppercase tracking-wider">
                  No favorite tokens yet
                </p>
              ) : searchQuery ? (
                <>
                  <p className="text-[#94A3B8] mb-2 uppercase tracking-wider">
                    No tokens found matching "{searchQuery}"
                  </p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="bg-[#2D3548] hover:bg-[#3D4663] text-white rounded-lg px-4 py-2 text-sm"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <p className="text-[#94A3B8] mb-2 uppercase tracking-wider">
                  No tokens available
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}