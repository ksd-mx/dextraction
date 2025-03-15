import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenInfo } from '@/types/token';
import { fetchTokens, fetchTokenPrices, getTokenBalances } from '@/api/token-api';
import { showNotification } from '@/store/notification-store';
import { PublicKey } from '@solana/web3.js';

interface TokenState {
  tokens: TokenInfo[];
  popularTokens: string[]; // List of popular token addresses
  favoriteTokens: string[]; // List of favorite token addresses (persisted)
  isLoadingTokens: boolean;
  isLoadingBalances: boolean;
  
  getTokenBySymbol: (symbol: string) => TokenInfo | undefined;
  getTokenByAddress: (address: string) => TokenInfo | undefined;
  toggleFavorite: (address: string) => void;
  fetchAllTokens: () => Promise<{ price: number; address: string; logoURI?: string; decimals: number; tags?: string[]; symbol: string; name: string; balance: number; }[]>;
  fetchTokenBalances: (walletAddress: string) => Promise<void>;
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

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      tokens: [],
      popularTokens: DEFAULT_POPULAR_TOKENS,
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
          
          // Fetch tokens from Jupiter
          const tokens = await fetchTokens();
          
          // Fetch token prices
          const priceMap = await fetchTokenPrices(tokens);
          
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
            set({ favoriteTokens: DEFAULT_POPULAR_TOKENS.slice(0, 5) });
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
          showNotification.error('Error fetching tokens', 'Could not load token list');
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
          
          try {
            new PublicKey(walletAddress);
          } catch (error) {
            throw new Error(`Invalid wallet address: ${error}`);
          }
          
          // Get token balances
          await getTokenBalances(walletAddress, tokens);
          
          // Update tokens with balances
          const tokensWithBalances = tokens.map(token => ({
            ...token,
            balance: parseFloat(token.balance.toString())
          }));
          
          set({ tokens: tokensWithBalances, isLoadingBalances: false });
        } catch (error) {
          console.error('Error fetching token balances:', error);
          set({ isLoadingBalances: false });
          showNotification.error(
            'Error fetching balances', 
            error instanceof Error ? error.message : 'Could not load token balances'
          );
        }
      },
    }),
    {
      name: 'token-store',
      partialize: (state) => ({ favoriteTokens: state.favoriteTokens }),
    }
  )
);