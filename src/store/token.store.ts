// src/store/token.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenInfo } from '@/types/token.types';
import { tokenService } from '@/services/token.service';
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
          
          // Use the token service to get tokens
          const tokens = await tokenService.getTokens(true);
          
          // If this is the first load, and there are no favorites yet, add some defaults
          if (get().favoriteTokens.length === 0) {
            set({ favoriteTokens: POPULAR_TOKEN_ADDRESSES.slice(0, 5) });
          }
          
          set({ tokens, isLoadingTokens: false });
          return tokens;
        } catch (error) {
          console.error('Error fetching tokens:', error);
          set({ isLoadingTokens: false });
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
          
          // Get token balances from service
          const balances = await tokenService.getTokenBalances(walletAddress);
          
          // Update tokens with balances
          const tokensWithBalances = get().tokens.map(token => ({
            ...token,
            balance: balances[token.address] || 0
          }));
          
          set({ tokens: tokensWithBalances, isLoadingBalances: false });
        } catch (error) {
          console.error('Error fetching token balances:', error);
          set({ isLoadingBalances: false });
          throw error;
        }
      },
    }),
    {
      name: 'token-store',
      partialize: (state) => ({ favoriteTokens: state.favoriteTokens }),
    }
  )
);