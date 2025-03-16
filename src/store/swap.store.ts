// src/store/swap.store.ts
import { create } from 'zustand';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { TokenInfo } from '@/types/token.types';
import { SwapQuoteResponse } from '@/types/swap.types';
import { MarketInfo } from '@/types/swap.types';
import { config } from '@/config/app-config';
import { swapService } from '@/services/swap.service';
import { tokenService } from '@/services/token.service';
import { showNotification } from '@/utils/notification.utils';
import { useTokenStore } from './token.store';
import { debounce } from 'lodash';

export type TransactionStatus = 'none' | 'processing' | 'success' | 'error';

export interface TransactionInfo {
  signature?: string;
  status: TransactionStatus;
  error?: string;
}

interface SwapState {
  fromToken: TokenInfo | null;
  toToken: TokenInfo | null;
  fromAmount: number;
  estimatedOutput: number;
  slippage: number;
  priceImpact: number;
  isLoading: boolean;
  isConnected: boolean;
  lastQuoteResponse: SwapQuoteResponse | null;
  marketInfos: MarketInfo[];
  transaction: TransactionInfo;
  
  setFromToken: (token: TokenInfo) => void;
  setToToken: (token: TokenInfo) => void;
  setFromAmount: (amount: number) => void;
  setSlippage: (slippage: number) => void;
  swapTokens: () => void;
  fetchPrice: () => Promise<void>;
  handleSwap: (walletState: { publicKey: string | undefined, signTransaction: (transaction: Transaction) => Promise<Transaction> }) => Promise<boolean>;
  setConnected: (connected: boolean) => void;
  initializeDefaultTokens: () => void;
  resetTransactionState: () => void;
}

// Create a debounced function
const debouncedFetchPrice = debounce(async (
  fromToken: TokenInfo | null,
  toToken: TokenInfo | null,
  fromAmount: number,
  slippage: number,
  setValues: (values: { estimatedOutput: number, priceImpact: number, lastQuoteResponse: SwapQuoteResponse | null, isLoading: boolean }) => void
) => {
  if (!fromToken || !toToken || fromAmount <= 0) {
    setValues({ estimatedOutput: 0, priceImpact: 0, lastQuoteResponse: null, isLoading: false });
    return;
  }
  
  try {
    // Get quote from service
    const quoteResponse = await swapService.getSwapQuote(
      fromToken,
      toToken,
      fromAmount,
      slippage
    );
    
    // Calculate output amount
    const outputAmount = swapService.calculateOutputAmount(quoteResponse, toToken);
    
    setValues({ 
      estimatedOutput: outputAmount,
      priceImpact: quoteResponse.priceImpactPct,
      lastQuoteResponse: quoteResponse,
      isLoading: false
    });
  } catch (error) {
    console.error('Error fetching price:', error);
    setValues({ 
      estimatedOutput: 0, 
      priceImpact: 0, 
      lastQuoteResponse: null,
      isLoading: false 
    });
  }
}, 500);

export const useSwapStore = create<SwapState>((set, get) => ({
  fromToken: null,
  toToken: null,
  fromAmount: 0,
  estimatedOutput: 0,
  slippage: config.slippage,
  priceImpact: 0,
  isLoading: false,
  isConnected: false,
  lastQuoteResponse: null,
  marketInfos: [],
  transaction: {
    status: 'none',
    signature: undefined,
    error: undefined
  },
  
  resetTransactionState: () => {
    set({
      transaction: {
        status: 'none',
        signature: undefined,
        error: undefined
      }
    });
  },
  
  initializeDefaultTokens: () => {
    const tokenStore = useTokenStore.getState();
    
    // Ensure tokens are loaded
    if (tokenStore.tokens.length === 0) {
      tokenStore.fetchAllTokens().then(() => {
        const solToken = tokenStore.getTokenBySymbol('SOL');
        const usdcToken = tokenStore.getTokenBySymbol('USDC');
        
        if (solToken && usdcToken) {
          set({
            fromToken: solToken,
            toToken: usdcToken,
          });
        }
      });
    } else {
      const solToken = tokenStore.getTokenBySymbol('SOL');
      const usdcToken = tokenStore.getTokenBySymbol('USDC');
      
      if (solToken && usdcToken) {
        set({
          fromToken: solToken,
          toToken: usdcToken,
        });
      }
    }
  },
  
  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },
  
  setFromToken: (token: TokenInfo) => {
    const { toToken } = get();
    
    // Prevent selecting the same token
    if (toToken && token.address === toToken.address) {
      set({
        fromToken: token,
        toToken: null,
      });
    } else {
      set({ fromToken: token });
    }
    
    // Reset price quote when token changes
    set({
      estimatedOutput: 0,
      priceImpact: 0,
      lastQuoteResponse: null,
    });
    
    // Recalculate price if both tokens are selected
    if (get().toToken && get().fromAmount > 0) {
      get().fetchPrice();
    }
  },
  
  setToToken: (token: TokenInfo) => {
    const { fromToken } = get();
    
    // Prevent selecting the same token
    if (fromToken && token.address === fromToken.address) {
      set({
        toToken: token,
        fromToken: null,
      });
    } else {
      set({ toToken: token });
    }
    
    // Reset price quote when token changes
    set({
      estimatedOutput: 0,
      priceImpact: 0,
      lastQuoteResponse: null,
    });
    
    // Recalculate price if both tokens are selected
    if (get().fromToken && get().fromAmount > 0) {
      get().fetchPrice();
    }
  },
  
  setFromAmount: (amount: number) => {
    set({ fromAmount: amount });
    
    // Reset price quote when amount changes significantly
    set({
      estimatedOutput: 0,
      priceImpact: 0,
      lastQuoteResponse: null,
    });
    
    // Recalculate price if both tokens are selected
    if (get().fromToken && get().toToken && amount > 0) {
      set({ isLoading: true });
      
      debouncedFetchPrice(
        get().fromToken,
        get().toToken,
        amount,
        get().slippage,
        (values) => set(values)
      );
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
    
    // Recalculate price with new slippage if we have tokens and amount
    const { fromToken, toToken, fromAmount } = get();
    if (fromToken && toToken && fromAmount > 0) {
      get().fetchPrice();
    }
  },
  
  swapTokens: () => {
    const { fromToken, toToken } = get();
    
    if (!fromToken || !toToken) return;
    
    set({ 
      fromToken: toToken,
      toToken: fromToken,
      estimatedOutput: 0,
      priceImpact: 0,
      lastQuoteResponse: null,
    });
    
    // Recalculate price if both tokens are selected
    if (toToken && fromToken && get().fromAmount > 0) {
      get().fetchPrice();
    }
  },
  
  fetchPrice: async () => {
    const { fromToken, toToken, fromAmount, slippage } = get();
    
    if (!fromToken || !toToken || fromAmount <= 0) {
      return;
    }
    
    set({ isLoading: true });
    
    // Use the debounced function for the actual fetch
    debouncedFetchPrice(
      fromToken,
      toToken,
      fromAmount,
      slippage,
      (values) => set(values)
    );
  },
  
  handleSwap: async (walletState: { publicKey: string | undefined, signTransaction: (transaction: Transaction) => Promise<Transaction> }) => {
    const { fromToken, toToken, fromAmount, lastQuoteResponse, isConnected } = get();
    
    if (!isConnected || !walletState.publicKey) {
      // This will be handled by the UI to open wallet modal
      return false;
    }
    
    if (!fromToken || !toToken || fromAmount <= 0 || !lastQuoteResponse) {
      showNotification.error(
        'SWAP ERROR', 
        'Please enter a valid amount and get a quote first',
        { position: 'bottom' }
      );
      return false;
    }
    
    set({ 
      isLoading: true,
      transaction: {
        status: 'processing',
        signature: undefined,
        error: undefined
      }
    });
    
    try {
      // Execute the swap using the swap service
      const signature = await swapService.executeSwap(
        lastQuoteResponse,
        walletState.publicKey,
        walletState.signTransaction
      );
      
      // Update transaction state with signature
      set({
        transaction: {
          status: 'processing',
          signature,
          error: undefined
        }
      });
      
      // Wait for confirmation
      const success = await swapService.confirmTransaction(signature);
      
      // Update transaction state based on confirmation result
      set({
        transaction: {
          status: success ? 'success' : 'error',
          signature,
          error: success ? undefined : 'Transaction failed to confirm'
        },
        isLoading: false
      });
      
      // Refresh token balances
      setTimeout(() => {
        if (walletState.publicKey) {
          useTokenStore.getState().fetchTokenBalances(walletState.publicKey);
        }
      }, 2000);
      
      return success;
    } catch (error) {
      console.error('Swap failed:', error);
      
      // Update transaction state to error
      set({
        transaction: {
          status: 'error',
          signature: get().transaction.signature,
          error: error instanceof Error ? error.message : 'An error occurred during the swap'
        },
        isLoading: false
      });
      
      return false;
    }
  },
}));