import { create } from 'zustand';
import { DEFAULT_SLIPPAGE } from '@/lib/constants';
import { Token } from '@/types/token';
import { delay } from '@/lib/utils';
import { useTokenStore } from './token-store';
import { showNotification } from './notification-store';

interface SwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: number;
  estimatedOutput: number;
  slippage: number;
  priceImpact: number;
  isLoading: boolean;
  isConnected: boolean;
  
  setFromToken: (token: Token) => void;
  setToToken: (token: Token) => void;
  setFromAmount: (amount: number) => void;
  setSlippage: (slippage: number) => void;
  swapTokens: () => void;
  fetchPrice: () => Promise<void>;
  handleSwap: () => Promise<boolean>;
  setConnected: (connected: boolean) => void;
  initializeDefaultTokens: () => void;
}

export const useSwapStore = create<SwapState>((set, get) => ({
  fromToken: null,
  toToken: null,
  fromAmount: 0,
  estimatedOutput: 0,
  slippage: DEFAULT_SLIPPAGE,
  priceImpact: 0,
  isLoading: false,
  isConnected: false,
  
  initializeDefaultTokens: () => {
    const tokenStore = useTokenStore.getState();
    const solToken = tokenStore.getTokenBySymbol('SOL');
    const usdcToken = tokenStore.getTokenBySymbol('USDC');
    
    if (solToken && usdcToken) {
      set({
        fromToken: solToken,
        toToken: usdcToken,
      });
    }
  },
  
  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },
  
  setFromToken: (token: Token) => {
    const { toToken } = get();
    
    // Prevent selecting the same token
    if (toToken && token.symbol === toToken.symbol) {
      set({
        fromToken: token,
        toToken: null,
      });
    } else {
      set({ fromToken: token });
    }
    
    // Recalculate price if both tokens are selected
    if (get().toToken && get().fromAmount > 0) {
      get().fetchPrice();
    }
  },
  
  setToToken: (token: Token) => {
    const { fromToken } = get();
    
    // Prevent selecting the same token
    if (fromToken && token.symbol === fromToken.symbol) {
      set({
        toToken: token,
        fromToken: null,
      });
    } else {
      set({ toToken: token });
    }
    
    // Recalculate price if both tokens are selected
    if (get().fromToken && get().fromAmount > 0) {
      get().fetchPrice();
    }
  },
  
  setFromAmount: (amount: number) => {
    set({ fromAmount: amount });
    
    // Recalculate price if both tokens are selected
    if (get().fromToken && get().toToken && amount > 0) {
      get().fetchPrice();
    } else if (amount === 0) {
      set({ estimatedOutput: 0, priceImpact: 0 });
    }
  },
  
  setSlippage: (slippage: number) => {
    set({ slippage });
    
    // Store slippage in local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('slippage', slippage.toString());
    }
  },
  
  swapTokens: () => {
    const { fromToken, toToken } = get();
    
    set({ 
      fromToken: toToken,
      toToken: fromToken,
      estimatedOutput: 0,
    });
    
    // Recalculate price if both tokens are selected
    if (toToken && fromToken && get().fromAmount > 0) {
      get().fetchPrice();
    }
  },
  
  fetchPrice: async () => {
    const { fromToken, toToken, fromAmount } = get();
    
    if (!fromToken || !toToken || fromAmount <= 0) {
      return;
    }
    
    set({ isLoading: true });
    
    try {
      // In a real implementation, we would fetch price from a DEX API
      // For now, simulate a network request
      await delay(500);
      
      // Mock price calculation based on token prices
      // In reality, this would use AMM formulas, liquidity, etc.
      const mockExchangeRate = fromToken.price / toToken.price;
      
      // Add some random variance to the price for demonstration
      const variance = 0.97 + Math.random() * 0.06; // 0.97 to 1.03
      const calculatedOutput = fromAmount * mockExchangeRate * variance;
      
      // Calculate a mock price impact (higher for larger amounts)
      // In a real DEX, this would be calculated based on pool reserves
      const impact = Math.min(fromAmount / 100, 10) * variance;
      
      set({ 
        estimatedOutput: calculatedOutput,
        priceImpact: impact,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching price:', error);
      set({ isLoading: false });
    }
  },
  
  handleSwap: async () => {
    const { fromToken, toToken, fromAmount, isConnected } = get();
    
    if (!isConnected) {
      // This will be handled by the UI to open wallet modal
      return false;
    }
    
    if (!fromToken || !toToken || fromAmount <= 0) {
      return false;
    }
    
    // In a real implementation, this would call a DEX API to execute the swap
    try {
      set({ isLoading: true });
      
      // Simulate a network request
      await delay(1500);
      
      // Show success notification
      showNotification.success(
        'SWAP SUCCESSFUL',
        `Swapped ${fromAmount} ${fromToken.symbol} to ${get().estimatedOutput.toFixed(4)} ${toToken.symbol}`
      );
      
      // Reset input after successful swap
      set({ 
        fromAmount: 0,
        estimatedOutput: 0,
        priceImpact: 0,
        isLoading: false,
      });
      
      return true;
    } catch (error) {
      console.error('Swap failed:', error);
      
      // Show error notification
      showNotification.error(
        'SWAP FAILED',
        error instanceof Error ? error.message : 'An error occurred during the swap'
      );
      
      set({ isLoading: false });
      return false;
    }
  },
}));