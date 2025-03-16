// src/store/token/token.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenInfo } from '@/types/token.types';
import { TokenApiService } from '@/api/token/token-api.service';
import { showNotification } from '@/store/notification.store';
import { POPULAR_TOKEN_ADDRESSES } from '@/constants/token.constants';

interface TokenState {
  tokens: TokenInfo[];
  popularTokens: string[]; // List of popular token addresses
  favoriteTokens: string[]; // List of favorite token addresses (persisted)
  isLoadingTokens: boolean;
  isLoadingBalances: boolean;
  
  // Selectors
  getTokenBySymbol: (symbol: string) => TokenInfo | undefined;
  getTokenByAddress: (address: string) => TokenInfo | undefined;
  
  // Actions
  toggleFavorite: (address: string) => void;
  fetchAllTokens: () => Promise<TokenInfo[]>;
  fetchTokenBalances: (walletAddress: string) => Promise<void>;
}

// Create token API service instance
const tokenApiService = new TokenApiService();

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      tokens: [],
      popularTokens: POPULAR_TOKEN_ADDRESSES,
      favoriteTokens: [],
      isLoadingTokens: false,
      isLoadingBalances: false,
      
      getTokenBySymbol: (symbol: string) => {
        return get().tokens.find(token => token.symbol === symbol);
      },
      
      getTokenByAddress: (address: string) => {
        return get().tokens.find(token => token.address === address);
      },
      
      toggleFavorite: (address: string) => {
        set((state) => {
          const isFavorite = state.favoriteTokens.includes(address);
          
          if (isFavorite) {
            return {
              favoriteTokens: state.favoriteTokens.filter(a => a !== address),
            };
          } else {
            return {
              favoriteTokens: [...state.favoriteTokens, address],
            };
          }
        });
      },
      
      fetchAllTokens: async () => {
        try {
          set({ isLoadingTokens: true });
          
          // Fetch tokens from API
          const tokens = await tokenApiService.getTokens();
          
          // Fetch token prices
          const priceMap = await tokenApiService.getTokenPrices();
          
          // Update tokens with prices
          const tokensWithPrices = tokens.map(token => ({
            ...token,
            price: priceMap[token.address] || 0
          }));
          
          // Filter out tokens with no price (likely spam or very low liquidity)
          const validTokens = tokensWithPrices.filter(token => 
            // Keep popular tokens even without price
            get().popularTokens.includes(token.address) || token.price > 0
          );
          
          // If this is the first load, and there are no favorites yet, add some defaults
          if (get().favoriteTokens.length === 0) {
            set({ favoriteTokens: POPULAR_TOKEN_ADDRESSES.slice(0, 5) });
          }
          
          // Sort by popularity and price
          const sortedTokens = validTokens.sort((a, b) => {
            const aIsPopular = get().popularTokens.includes(a.address);
            const bIsPopular = get().popularTokens.includes(b.address);
            
            if (aIsPopular && !bIsPopular) return -1;
            if (!aIsPopular && bIsPopular) return 1;
            
            // Then sort by market cap (approximated by price)
            return b.price - a.price;
          });
          
          set({ tokens: sortedTokens, isLoadingTokens: false });
          return sortedTokens;
        } catch (error) {
          console.error('Error fetching tokens:', error);
          set({ isLoadingTokens: false });
          showNotification({
            type: 'error',
            title: 'Error fetching tokens',
            message: 'Could not load token list'
          });
          throw error;
        }
      },
      
      fetchTokenBalances: async (walletAddress: string) => {
        if (!walletAddress) return;
        
        try {
          set({ isLoadingBalances: true });
          
          // Get current tokens
          const { tokens } = get();
          if (tokens.length === 0) {
            await get().fetchAllTokens();
          }
          
          // Get token balances from API
          const balances = await tokenApiService.getTokenBalances({
            walletAddress
          });
          
          // Update tokens with balances
          const tokensWithBalances = tokens.map(token => ({
            ...token,
            balance: balances[token.address] || 0
          }));
          
          set({ tokens: tokensWithBalances, isLoadingBalances: false });
        } catch (error) {
          console.error('Error fetching token balances:', error);
          set({ isLoadingBalances: false });
          showNotification({
            type: 'error',
            title: 'Error fetching balances',
            message: error instanceof Error ? error.message : 'Could not load token balances'
          });
        }
      },
    }),
    {
      name: 'token-store',
      partialize: (state) => ({ favoriteTokens: state.favoriteTokens }),
    }
  )
);