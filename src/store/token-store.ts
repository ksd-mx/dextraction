import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenInfo } from '@/types/token';
import { fetchTokensWithPrices, refreshTokenPrices, getTokenBalances, batchUpdateTokenBalances } from '@/api/token-api';
import { showNotification } from '@/store/notification-store';
import { PublicKey } from '@solana/web3.js';
import debounce from 'lodash.debounce';

interface TokenState {
  tokens: TokenInfo[];
  filteredTokens: TokenInfo[]; // Optimized list for display
  favoriteTokens: string[]; // List of favorite token addresses (persisted)
  isLoadingTokens: boolean;
  isLoadingBalances: boolean;
  hasTokenError: boolean; // Track error state
  lastUpdated: number | null;
  walletAddress: string | null;
  searchQuery: string;
  
  // Getters
  getTokenBySymbol: (symbol: string) => TokenInfo | undefined;
  getTokenByAddress: (address: string) => TokenInfo | undefined;
  
  // Actions
  toggleFavorite: (address: string) => void;
  fetchAllTokens: () => Promise<TokenInfo[]>;
  fetchTokenBalances: (walletAddress: string) => Promise<void>;
  refreshPrices: () => Promise<void>;
  updateFilteredTokens: (query?: string) => void;
  setSearchQuery: (query: string) => void;
  resetErrorState: () => void; // Reset error state
}

// List of popular token addresses on Solana - useful for sorting 
const POPULAR_TOKEN_ADDRESSES = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
];

// Create a properly typed debounced function for filtering tokens
const debouncedFilter = debounce(
  (
    tokens: TokenInfo[], 
    query: string, 
    popularTokens: string[], 
    favoriteTokens: string[], 
    callback: (filtered: TokenInfo[]) => void
  ) => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Skip filtering if the query is empty
    if (!lowerQuery) {
      callback(tokens);
      return;
    }
    
    const filtered = tokens.filter(token => {
      return (
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery) ||
        token.address.toLowerCase() === lowerQuery
      );
    });
    
    // Sort filtered results: favorites > popular > balance > alphabetical
    const sortedFiltered = [...filtered].sort((a, b) => {
      // First by favorites
      const aIsFavorite = favoriteTokens.includes(a.address);
      const bIsFavorite = favoriteTokens.includes(b.address);
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Then by balance (tokens user owns)
      if (a.balance > 0 && b.balance === 0) return -1;
      if (a.balance === 0 && b.balance > 0) return 1;
      
      // Then by popular tokens
      const aIsPopular = popularTokens.includes(a.address);
      const bIsPopular = popularTokens.includes(b.address);
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      
      // Finally by symbol
      return a.symbol.localeCompare(b.symbol);
    });
    
    callback(sortedFiltered);
  }, 
  100
);

// Prevent multiple concurrent fetches
let isFetchingTokens = false;

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      tokens: [],
      filteredTokens: [],
      favoriteTokens: [],
      isLoadingTokens: false,
      isLoadingBalances: false,
      hasTokenError: false,
      lastUpdated: null,
      walletAddress: null,
      searchQuery: '',
      
      resetErrorState: () => {
        set({ hasTokenError: false });
      },
      
      getTokenBySymbol: (symbol: string) => {
        return get().tokens.find(token => token.symbol === symbol);
      },
      
      getTokenByAddress: (address: string) => {
        return get().tokens.find(token => token.address === address);
      },
      
      toggleFavorite: (address: string) => {
        set((state) => {
          const isFavorite = state.favoriteTokens.includes(address);
          
          const newFavorites = isFavorite
            ? state.favoriteTokens.filter(a => a !== address)
            : [...state.favoriteTokens, address];
          
          // Re-filter tokens to update sort order
          const updatedState = { favoriteTokens: newFavorites };
          
          // Re-run the filter if there's a search query
          if (state.searchQuery) {
            debouncedFilter(
              state.tokens, 
              state.searchQuery, 
              POPULAR_TOKEN_ADDRESSES, 
              newFavorites, 
              (filtered) => set({ filteredTokens: filtered })
            );
          }
          
          return updatedState;
        });
      },
      
      updateFilteredTokens: (query?: string) => {
        const { tokens, favoriteTokens } = get();
        const searchString = query !== undefined ? query : get().searchQuery;
        
        if (!searchString.trim()) {
          // When query is empty, show sorted tokens without filtering
          const sorted = [...tokens].sort((a, b) => {
            // First by favorites
            const aIsFavorite = favoriteTokens.includes(a.address);
            const bIsFavorite = favoriteTokens.includes(b.address);
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            // Then by balance (tokens user owns)
            if (a.balance > 0 && b.balance === 0) return -1;
            if (a.balance === 0 && b.balance > 0) return 1;
            
            // Then by popular tokens
            const aIsPopular = POPULAR_TOKEN_ADDRESSES.includes(a.address);
            const bIsPopular = POPULAR_TOKEN_ADDRESSES.includes(b.address);
            if (aIsPopular && !bIsPopular) return -1;
            if (!aIsPopular && bIsPopular) return 1;
            
            // Finally by symbol
            return a.symbol.localeCompare(b.symbol);
          });
          
          set({ filteredTokens: sorted });
          return;
        }
        
        // Apply filtering with debounce
        debouncedFilter(
          tokens, 
          searchString, 
          POPULAR_TOKEN_ADDRESSES, 
          favoriteTokens, 
          (filtered) => set({ filteredTokens: filtered })
        );
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().updateFilteredTokens(query);
      },
      
      fetchAllTokens: async () => {
        // Prevent multiple concurrent fetches
        if (isFetchingTokens) {
          console.log('Token fetch already in progress, skipping duplicate request');
          return get().tokens;
        }
        
        try {
          isFetchingTokens = true;
          set({ isLoadingTokens: true, hasTokenError: false });
          
          // Check if we need to refresh token cache
          const lastFetchTime = get().lastUpdated || 0;
          const currentTime = Date.now();
          const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
          
          // Only fetch new tokens if:
          // 1. We don't have any tokens yet, or
          // 2. It's been more than 24 hours since the last update
          const shouldFetchNewTokens = 
            get().tokens.length === 0 ||
            currentTime - lastFetchTime > oneDayMs;
          
          if (!shouldFetchNewTokens) {
            console.log('Using cached tokens, last updated:', new Date(lastFetchTime).toLocaleString());
            set({ isLoadingTokens: false });
            isFetchingTokens = false;
            return get().tokens;
          }
          
          // Fetch tokens with prices
          const tokens = await fetchTokensWithPrices();
          
          // If we got no tokens, keep existing tokens and set error
          if (!tokens || tokens.length === 0) {
            set({
              isLoadingTokens: false,
              hasTokenError: true
            });
            
            showNotification.error(
              'Token Fetch Error',
              'Could not load token list. Please try again later.'
            );
            
            isFetchingTokens = false;
            return get().tokens;
          }
          
          // Sort tokens by favorites, balance, and popularity
          const sortedTokens = [...tokens].sort((a, b) => {
            // First by favorites
            const aIsFavorite = get().favoriteTokens.includes(a.address);
            const bIsFavorite = get().favoriteTokens.includes(b.address);
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            // Then by balance (tokens user owns)
            if (a.balance > 0 && b.balance === 0) return -1;
            if (a.balance === 0 && b.balance > 0) return 1;
            
            // Then by popular tokens
            const aIsPopular = POPULAR_TOKEN_ADDRESSES.includes(a.address);
            const bIsPopular = POPULAR_TOKEN_ADDRESSES.includes(b.address);
            if (aIsPopular && !bIsPopular) return -1;
            if (!aIsPopular && bIsPopular) return 1;
            
            // Finally by symbol
            return a.symbol.localeCompare(b.symbol);
          });
          
          set({ 
            tokens: sortedTokens, 
            filteredTokens: sortedTokens,
            isLoadingTokens: false,
            hasTokenError: false,
            lastUpdated: Date.now() 
          });
          
          isFetchingTokens = false;
          return sortedTokens;
        } catch (error) {
          console.error('Error fetching tokens:', error);
          
          set({ 
            isLoadingTokens: false, 
            hasTokenError: true 
          });
          
          showNotification.error(
            'Token Fetch Error',
            'Could not load token list. Please try again later.'
          );
          
          isFetchingTokens = false;
          return get().tokens;
        }
      },
      
      fetchTokenBalances: async (walletAddress: string) => {
        if (!walletAddress) return;
        
        try {
          // Don't fetch balances if we're already loading
          if (get().isLoadingBalances) {
            console.log('Balance fetch already in progress, skipping duplicate request');
            return;
          }
          
          set({ isLoadingBalances: true });
          
          // Validate wallet address
          try {
            new PublicKey(walletAddress);
          } catch (error) {
            throw new Error(`Invalid wallet address: ${error}`);
          }
          
          // Store the wallet address
          set({ walletAddress });
          
          // Get current tokens
          const { tokens } = get();
          if (tokens.length === 0) {
            await get().fetchAllTokens();
          }
          
          // Get token balances efficiently
          const currentTokens = get().tokens;
          
          // Create a shallow copy to avoid mutating the state directly
          const tokensCopy = currentTokens.map(t => ({...t}));
          
          // Get priority tokens (SOL, USDC, USDT, etc.)
          const priorityTokens = tokensCopy.filter(token => 
            POPULAR_TOKEN_ADDRESSES.slice(0, 5).includes(token.address) || 
            get().favoriteTokens.includes(token.address)
          );
          
          try {
            // First fetch high-priority token balances
            const balanceMap = await getTokenBalances(walletAddress, priorityTokens);
            
            // Update high-priority tokens with balances
            for (const token of priorityTokens) {
              if (balanceMap.has(token.address)) {
                const index = tokensCopy.findIndex(t => t.address === token.address);
                if (index >= 0) {
                  tokensCopy[index].balance = balanceMap.get(token.address) || 0;
                }
              }
            }
            
            // Update state with priority token balances first for quick UI update
            set({
              tokens: tokensCopy,
              lastUpdated: Date.now()
            });
            
            // Update filtered tokens
            get().updateFilteredTokens();
            
            // Then fetch all remaining token balances in the background
            batchUpdateTokenBalances(walletAddress, tokensCopy)
              .then(() => {
                // When all balances are loaded, update the state one more time
                set({
                  tokens: [...tokensCopy], // Use a new reference to trigger re-renders
                  isLoadingBalances: false,
                  lastUpdated: Date.now()
                });
                
                // Update filtered tokens again
                get().updateFilteredTokens();
              })
              .catch(error => {
                console.error('Error in background balance update:', error);
                set({ isLoadingBalances: false });
              });
            
          } catch (error) {
            console.error('Error fetching token balances:', error);
            set({ isLoadingBalances: false });
          }
        } catch (error) {
          console.error('Error in fetchTokenBalances:', error);
          set({ isLoadingBalances: false });
          
          showNotification.error(
            'Balance Fetch Error', 
            error instanceof Error ? error.message : 'Failed to fetch token balances'
          );
        }
      },
      
      refreshPrices: async () => {
        const { tokens } = get();
        if (tokens.length === 0) return;
        
        try {
          // Create a copy of tokens to avoid direct mutation
          const tokensCopy = tokens.map(t => ({...t}));
          
          // Refresh prices and update tokens
          await refreshTokenPrices(tokensCopy);
          
          // Update state with new prices
          set({ 
            tokens: tokensCopy,
            lastUpdated: Date.now()
          });
          
          // Update filtered tokens
          get().updateFilteredTokens();
        } catch (error) {
          console.error('Error refreshing prices:', error);
          // No notification here - price refresh failures should be silent
        }
      }
    }),
    {
      name: 'token-store',
      partialize: (state) => ({ 
        favoriteTokens: state.favoriteTokens,
        // Include lastUpdated to track when tokens were last fetched
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);