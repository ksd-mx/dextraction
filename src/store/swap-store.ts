import { create } from 'zustand';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useTokenStore } from './token-store';
import { showNotification } from './notification-store';
import { TokenInfo } from '@/core/types/token.types';
import { config } from '@/utils/config';
import { swapService } from '@/core/services/swap.service';
import { debounce, DebouncedFunc } from 'lodash';
import { SwapQuoteResponse } from '@/core/types/swap.types';
import { MarketInfo } from '@/core/types/swap.types';

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

type SetState = (state: Partial<SwapState>) => void;

// Debounced version of the fetchPrice function to avoid too many API calls
const debouncedFetchPrice: DebouncedFunc<(state: SwapState, set: SetState) => Promise<void>> = debounce(async (state, set) => {
  const { fromToken, toToken, fromAmount, slippage } = state;
  
  if (!fromToken || !toToken || fromAmount <= 0) {
    set({ estimatedOutput: 0, priceImpact: 0, isLoading: false });
    return;
  }
  
  try {
    // Convert amount to lamports/smallest unit using token decimals
    const inputDecimals = fromToken.decimals;
    const inputAmount = Math.floor(fromAmount * (10 ** inputDecimals));
    
    // Get quote from Jupiter
    const quoteResponse = await swapService.getSwapQuote(
      fromToken,
      toToken,
      inputAmount,
      slippage,
    );
    
    // Convert output amount from lamports/smallest unit back to token amount
    const outputDecimals = toToken.decimals;
    const outputAmount = Number(quoteResponse.outAmount) / (10 ** outputDecimals);
    
    set({ 
      estimatedOutput: outputAmount,
      priceImpact: quoteResponse.priceImpactPct,
      lastQuoteResponse: quoteResponse,
      isLoading: false
    });
  } catch (error) {
    console.error('Error fetching price:', error);
    set({ 
      estimatedOutput: 0, 
      priceImpact: 0, 
      lastQuoteResponse: null,
      isLoading: false 
    });
    
    if (error instanceof Error) {
      showNotification.error(
        'Quote Error', 
        error.message
      );
    }
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
      debouncedFetchPrice(get(), set);
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
    const { fromToken, toToken, fromAmount } = get();
    
    if (!fromToken || !toToken || fromAmount <= 0) {
      return;
    }
    
    set({ isLoading: true });
    
    // Actual fetch is delegated to the debounced function
    // But we call it directly here for immediate feedback
    await debouncedFetchPrice(get(), set);
  },
  
  handleSwap: async (walletState: { publicKey: string | undefined, signTransaction: (transaction: Transaction) => Promise<Transaction> }) => {
    const { fromToken, toToken, fromAmount, lastQuoteResponse, isConnected } = get();
    console.log('Estimated output:', get().estimatedOutput);
    
    if (!isConnected || !walletState.publicKey) {
      // This will be handled by the UI to open wallet modal
      return false;
    }
    
    if (!fromToken || !toToken || fromAmount <= 0 || !lastQuoteResponse) {
      showNotification.error(
        'SWAP ERROR', 
        'Please enter a valid amount and get a quote first'
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
      // Get the swap transaction
      const transactionResponse = await swapService.getSwapTransaction(
        lastQuoteResponse,
        walletState.publicKey
      );
      
      // Deserialize the transaction
      const swapTransaction = Transaction.from(
        Buffer.from(transactionResponse.swapTransaction, 'base64')
      );
      
      // Connect to the Solana network
      const connection = new Connection(config.solana.rpcUrl);
      
      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      swapTransaction.recentBlockhash = blockhash;
      swapTransaction.feePayer = new PublicKey(walletState.publicKey);
      
      // Request signature from the wallet adapter
      const signedTransaction = await walletState.signTransaction(swapTransaction);
      
      // Submit the transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      
      // Update transaction state with signature
      set({
        transaction: {
          status: 'processing',
          signature: signature,
          error: undefined
        }
      });
      
      // Show notification with signature
      showNotification.info(
        'TRANSACTION SUBMITTED',
        `Transaction sent: ${signature.substring(0, 8)}...`,
        {
          autoClose: true,
          duration: 5000,
        }
      );
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }
      
      // Update transaction state to success
      set({
        transaction: {
          status: 'success',
          signature: signature,
          error: undefined
        },
        isLoading: false
      });
      
      // Refresh token balances
      setTimeout(() => {
        if (walletState.publicKey) {
          useTokenStore.getState().fetchTokenBalances(walletState.publicKey);
        }
      }, 2000);
      
      return true;
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