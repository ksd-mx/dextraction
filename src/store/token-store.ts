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
  popularTokens: string[]; // List of popular token addresses
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

// List of popular token addresses on Solana
const DEFAULT_POPULAR_TOKENS = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
  'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ', // DUST
  'ARzG5HLU6u1n8G4VChSuEKpX7BE1apcjV4cKyCfhzJYC', // MYRO
  'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', // HNT
];

// Fallback tokens for when API fails
const FALLBACK_TOKENS: TokenInfo[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    price: 0,
    balance: 0,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    tags: ['native']
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    price: 0,
    balance: 0,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    tags: ['stablecoin']
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    price: 0,
    balance: 0,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
    tags: ['stablecoin']
  }
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
      
      // Then by popular
      const aIsPopular = popularTokens.includes(a.address);
      const bIsPopular = popularTokens.includes(b.address);
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      
      // Then by balance
      if (a.balance > 0 && b.balance === 0) return -1;
      if (a.balance === 0 && b.balance > 0) return 1;
      
      // Finally by symbol
      return a.symbol.localeCompare(b.symbol);
    });
    
    callback(sortedFiltered);
  }, 
  100
);

// Prevent multiple concurrent fetches
let isFetchingTokens = false;
let tokenFetchTimeout: NodeJS.Timeout | null = null;

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      tokens: [],
      filteredTokens: [],
      popularTokens: DEFAULT_POPULAR_TOKENS,
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
              state.popularTokens, 
              newFavorites, 
              (filtered) => set({ filteredTokens: filtered })
            );
          }
          
          return updatedState;
        });
      },
      
      updateFilteredTokens: (query?: string) => {
        const { tokens, popularTokens, favoriteTokens } = get();
        const searchString = query !== undefined ? query : get().searchQuery;
        
        if (!searchString.trim()) {
          // When query is empty, show sorted tokens without filtering
          const sorted = [...tokens].sort((a, b) => {
            // First by favorites
            const aIsFavorite = favoriteTokens.includes(a.address);
            const bIsFavorite = favoriteTokens.includes(b.address);
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            // Then by popular
            const aIsPopular = popularTokens.includes(a.address);
            const bIsPopular = popularTokens.includes(b.address);
            if (aIsPopular && !bIsPopular) return -1;
            if (!aIsPopular && bIsPopular) return 1;
            
            // Then by balance
            if (a.balance > 0 && b.balance === 0) return -1;
            if (a.balance === 0 && b.balance > 0) return 1;
            
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
          popularTokens, 
          favoriteTokens, 
          (filtered) => set({ filteredTokens: filtered })
        );
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().updateFilteredTokens(query);
      },
      
      fetchAllTokens: async () => {
        // Prevent multiple concurrent fetches and implement circuit-breaker
        if (isFetchingTokens) {
          console.log('Token fetch already in progress, skipping duplicate request');
          return get().tokens;
        }
        
        // Clear any existing timeout to prevent memory leaks
        if (tokenFetchTimeout) {
          clearTimeout(tokenFetchTimeout);
          tokenFetchTimeout = null;
        }
        
        try {
          isFetchingTokens = true;
          set({ isLoadingTokens: true, hasTokenError: false });
          
          // Set a timeout to automatically release the fetch lock after 30 seconds
          // This prevents deadlocks if something goes wrong
          tokenFetchTimeout = setTimeout(() => {
            console.warn('Token fetch timeout exceeded, releasing lock');
            isFetchingTokens = false;
            tokenFetchTimeout = null;
            
            // If we're still loading, we need to reset the state
            if (get().isLoadingTokens) {
              set({ 
                isLoadingTokens: false,
                hasTokenError: true
              });
              
              // Show error notification only once
              showNotification.error(
                'Token Fetch Error',
                'Could not load token list in time. Please try again later.'
              );
            }
          }, 30000);
          
          // Use the optimized function to fetch tokens with prices
          const tokens = await fetchTokensWithPrices();
          
          // If this is the first load, and there are no favorites yet, add some defaults
          if (get().favoriteTokens.length === 0) {
            set({ favoriteTokens: DEFAULT_POPULAR_TOKENS.slice(0, 5) });
          }
          
          // If API returned empty, use fallbacks instead of failing
          if (!tokens || tokens.length === 0) {
            set({
              tokens: FALLBACK_TOKENS,
              filteredTokens: FALLBACK_TOKENS,
              isLoadingTokens: false,
              hasTokenError: true,
              lastUpdated: Date.now()
            });
            
            showNotification.error(
              'Token Fetch Error',
              'Could not load token list. Using fallback tokens.'
            );
            
            isFetchingTokens = false;
            if (tokenFetchTimeout) {
              clearTimeout(tokenFetchTimeout);
              tokenFetchTimeout = null;
            }
            
            return FALLBACK_TOKENS;
          }
          
          // Filter out tokens with no price (likely spam or very low liquidity)
          // unless they are popular tokens
          const validTokens = tokens.filter(token => 
            get().popularTokens.includes(token.address) || 
            get().favoriteTokens.includes(token.address) || 
            token.price > 0
          );
          
          // Sort by popularity, favorites, and price
          const sortedTokens = validTokens.sort((a, b) => {
            // First by balance
            if (a.balance > 0 && b.balance === 0) return -1;
            if (a.balance === 0 && b.balance > 0) return 1;
            
            // Then by favorites
            const aIsFavorite = get().favoriteTokens.includes(a.address);
            const bIsFavorite = get().favoriteTokens.includes(b.address);
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            // Then by popularity
            const aIsPopular = get().popularTokens.includes(a.address);
            const bIsPopular = get().popularTokens.includes(b.address);
            if (aIsPopular && !bIsPopular) return -1;
            if (!aIsPopular && bIsPopular) return 1;
            
            // Finally by price (as a proxy for importance)
            return b.price - a.price;
          });
          
          set({ 
            tokens: sortedTokens, 
            filteredTokens: sortedTokens,
            isLoadingTokens: false,
            hasTokenError: false,
            lastUpdated: Date.now() 
          });
          
          isFetchingTokens = false;
          if (tokenFetchTimeout) {
            clearTimeout(tokenFetchTimeout);
            tokenFetchTimeout = null;
          }
          
          return sortedTokens;
        } catch (error) {
          console.error('Error fetching tokens:', error);
          
          // Release locks on error
          isFetchingTokens = false;
          if (tokenFetchTimeout) {
            clearTimeout(tokenFetchTimeout);
            tokenFetchTimeout = null;
          }
          
          // If tokens array is empty, use fallback tokens
          if (get().tokens.length === 0) {
            set({
              tokens: FALLBACK_TOKENS,
              filteredTokens: FALLBACK_TOKENS,
              isLoadingTokens: false,
              hasTokenError: true,
              lastUpdated: Date.now()
            });
            
            showNotification.error(
              'Token Fetch Error',
              'Could not load token list. Using fallback tokens.'
            );
            
            return FALLBACK_TOKENS;
          } else {
            // Otherwise use what we already have
            set({ isLoadingTokens: false, hasTokenError: true });
            
            showNotification.error(
              'Token Fetch Error',
              'Could not update token list. Using cached data.'
            );
            
            return get().tokens;
          }
        }
      },
      
      fetchTokenBalances: async (walletAddress: string) => {
        if (!walletAddress) return;
        
        // Use a local lock to prevent concurrent balance fetches
        let isBalanceFetchInProgress = false;
        
        try {
          // Don't fetch balances if we're already loading
          if (get().isLoadingBalances || isBalanceFetchInProgress) {
            console.log('Balance fetch already in progress, skipping duplicate request');
            return;
          }
          
          isBalanceFetchInProgress = true;
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
            const newTokens = await get().fetchAllTokens();
            
            // If token fetch failed, bail out
            if (newTokens.length === 0) {
              set({ isLoadingBalances: false });
              isBalanceFetchInProgress = false;
              return;
            }
          }
          
          // Ensure we still have the most recent tokens after any async operations
          const currentTokens = get().tokens;
          
          // Get token balances for prioritized tokens first (SOL, USDC, etc.)
          const priorityAddresses = [
            ...DEFAULT_POPULAR_TOKENS.slice(0, 3),  // SOL, USDC, USDT
            ...get().favoriteTokens
          ];
          
          const priorityTokens = currentTokens.filter(token => 
            priorityAddresses.includes(token.address)
          );
          
          // Create a shallow copy to avoid mutating the state directly
          const tokensCopy = currentTokens.map(t => ({...t}));
          
          try {
            // Get balances for priority tokens immediately - with error handling
            const balanceMap = await getTokenBalances(walletAddress, priorityTokens);
            
            // If balanceMap is empty, something went wrong with the API - don't update
            if (balanceMap.size === 0) {
              throw new Error('Failed to fetch token balances');
            }
            
            // Update only the priority tokens' balances in our copy
            priorityTokens.forEach(token => {
              const index = tokensCopy.findIndex(t => t.address === token.address);
              if (index >= 0 && balanceMap.has(token.address)) {
                tokensCopy[index].balance = balanceMap.get(token.address) || 0;
              }
            });
            
            // Update state with priority balances
            set({
              tokens: tokensCopy,
              isLoadingBalances: false,
              lastUpdated: Date.now()
            });
            
            // Update filtered tokens
            get().updateFilteredTokens();
            
            // Set a flag to prevent duplicate calls
            isBalanceFetchInProgress = false;
            
            // Then fetch remaining token balances in the background with a timeout
            const balanceTimeout = setTimeout(() => {
              console.warn('Balance update timeout exceeded, abandoning fetch');
            }, 15000);
            
            batchUpdateTokenBalances(walletAddress, tokensCopy)
              .then(() => {
                clearTimeout(balanceTimeout);
                
                // When all balances are loaded, update the state one more time
                set({
                  tokens: [...tokensCopy], // Use a new reference to trigger re-renders
                  lastUpdated: Date.now()
                });
                
                // Update filtered tokens again
                get().updateFilteredTokens();
              })
              .catch(error => {
                clearTimeout(balanceTimeout);
                console.error('Error in background balance update:', error);
              });
              
          } catch (error) {
            console.error('Error fetching priority token balances:', error);
            
            // If we failed to fetch balances, just use existing tokens but still finish loading
            set({ isLoadingBalances: false });
            isBalanceFetchInProgress = false;
          }
        } catch (error) {
          console.error('Error in fetchTokenBalances:', error);
          set({ isLoadingBalances: false });
          isBalanceFetchInProgress = false;
          
          // Show a notification only if the error isn't just a duplicate request
          if (!(error as Error).message?.includes('already in progress')) {
            showNotification.error(
              'Balance Fetch Error', 
              (error as Error).message || 'Could not load token balances'
            );
          }
        }
      },
      
      refreshPrices: async () => {
        const { tokens } = get();
        if (tokens.length === 0) return;
        
        // Use a local lock to prevent concurrent price refreshes
        let isPriceRefreshInProgress = false;
        
        try {
          // Skip if we're already refreshing prices
          if (isPriceRefreshInProgress) {
            console.log('Price refresh already in progress, skipping duplicate request');
            return;
          }
          
          isPriceRefreshInProgress = true;
          
          // Refresh prices without blocking UI - create a copy to avoid direct mutation
          const tokensCopy = tokens.map(t => ({...t}));
          const priceMap = await refreshTokenPrices(tokensCopy);
          
          // If price map is empty, don't update - this means the API call failed
          if (Object.keys(priceMap).length === 0) {
            console.warn('Price refresh returned no data, keeping existing prices');
            isPriceRefreshInProgress = false;
            return;
          }
          
          // Update tokens with new prices
          const updatedTokens = tokensCopy.map(token => ({
            ...token,
            price: priceMap[token.address] || token.price
          }));
          
          set({ 
            tokens: updatedTokens,
            lastUpdated: Date.now()
          });
          
          // Update filtered tokens
          get().updateFilteredTokens();
          isPriceRefreshInProgress = false;
        } catch (error) {
          console.error('Error refreshing prices:', error);
          isPriceRefreshInProgress = false;
          // No notification here - price refresh failures are quiet
        }
      }
    }),
    {
      name: 'token-store',
      partialize: (state) => ({ 
        favoriteTokens: state.favoriteTokens,
      }),
    }
  )
);