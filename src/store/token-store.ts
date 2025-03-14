import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Connection, PublicKey } from '@solana/web3.js';
import { Token } from '@/types/token';
import { config } from '@/lib/config';

interface TokenState {
  tokens: Token[];
  favoriteTokens: string[];
  getTokenBySymbol: (symbol: string) => Token | undefined;
  toggleFavorite: (symbol: string) => void;
  fetchTokenBalances: (walletAddress: string) => Promise<void>;
  isLoadingBalances: boolean;
}

// Mock token data for our DEX
const mockTokens: Token[] = [
  { symbol: 'SOL', name: 'Solana', price: 137.45, balance: 0 },
  { symbol: 'USDC', name: 'USD Coin', price: 1.00, balance: 0 },
  { symbol: 'BONK', name: 'Bonk', price: 0.00001895, balance: 0 },
  { symbol: 'JUP', name: 'Jupiter', price: 1.72, balance: 0 },
  { symbol: 'RAY', name: 'Raydium', price: 1.12, balance: 0 },
  { symbol: 'ORCA', name: 'Orca', price: 1.65, balance: 0 },
  { symbol: 'MNGO', name: 'Mango', price: 0.32, balance: 0 },
  { symbol: 'SBR', name: 'Saber', price: 0.21, balance: 0 },
  { symbol: 'STEP', name: 'Step Finance', price: 0.15, balance: 0 },
  { symbol: 'ATLAS', name: 'Star Atlas', price: 0.0075, balance: 0 },
  { symbol: 'POLIS', name: 'Star Atlas DAO', price: 0.42, balance: 0 },
  { symbol: 'SAMO', name: 'Samoyedcoin', price: 0.0085, balance: 0 },
  { symbol: 'ETH', name: 'Ethereum (Wormhole)', price: 3485.50, balance: 0 },
  { symbol: 'BTC', name: 'Bitcoin (Wormhole)', price: 64325.75, balance: 0 },
  { symbol: 'USDT', name: 'Tether', price: 1.00, balance: 0 },
];

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      tokens: mockTokens,
      favoriteTokens: ['SOL', 'USDC', 'JUP'], // Default favorites
      isLoadingBalances: false,
      
      getTokenBySymbol: (symbol: string) => {
        return get().tokens.find(token => token.symbol === symbol);
      },
      
      toggleFavorite: (symbol: string) => {
        set((state) => {
          const isFavorite = state.favoriteTokens.includes(symbol);
          
          if (isFavorite) {
            return {
              favoriteTokens: state.favoriteTokens.filter(s => s !== symbol),
            };
          } else {
            return {
              favoriteTokens: [...state.favoriteTokens, symbol],
            };
          }
        });
      },
      
      // For demonstration purposes, we'll only fetch the SOL balance
      // In a real app, you would use token account parsing for SPL tokens
      fetchTokenBalances: async (walletAddress: string) => {
        if (!walletAddress) return;
        
        set({ isLoadingBalances: true });
        
        try {
          const connection = new Connection(config.solana.rpcUrl);
          const publicKey = new PublicKey(walletAddress);
          
          // Get SOL balance
          const solBalance = await connection.getBalance(publicKey);
          const solBalanceInSOL = solBalance / 1_000_000_000; // Convert lamports to SOL
          
          // Update only the SOL token balance
          const updatedTokens = get().tokens.map(token => {
            if (token.symbol === 'SOL') {
              return { ...token, balance: solBalanceInSOL };
            }
            // For other tokens, add small mock balances for testing
            // In a real app, you'd fetch these from the blockchain
            return { 
              ...token, 
              balance: token.symbol === 'USDC' ? 25 : 
                       token.symbol === 'JUP' ? 10 : 
                       Math.random() * 5
            };
          });
          
          set({ tokens: updatedTokens, isLoadingBalances: false });
        } catch (error) {
          console.error('Error fetching SOL balance:', error);
          set({ isLoadingBalances: false });
        }
      },
    }),
    {
      name: 'token-store',
      partialize: (state) => ({ favoriteTokens: state.favoriteTokens }),
    }
  )
);