// src/hooks/api/use-swap-api.hook.ts
import { useState, useCallback } from 'react';
import { SwapApiService } from '@/api/swap/swap-api.service';
import { SwapQuoteRequest, SwapTransactionRequest } from '@/api/swap/swap-api.types';
import { SwapQuoteResponse, TransactionResponse } from '@/types/swap.types';
import { showError } from '@/utils/notification.utils';

// Create a singleton instance of the service
const swapApiService = new SwapApiService();

interface UseSwapApiResult {
  isLoading: boolean;
  error: Error | null;
  lastQuote: SwapQuoteResponse | null;
  getQuote: (request: SwapQuoteRequest) => Promise<SwapQuoteResponse>;
  getSwapTransaction: (request: SwapTransactionRequest) => Promise<TransactionResponse>;
}

export function useSwapApi(): UseSwapApiResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastQuote, setLastQuote] = useState<SwapQuoteResponse | null>(null);

  // Get swap quote 
  const getQuote = useCallback(async (request: SwapQuoteRequest): Promise<SwapQuoteResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const quote = await swapApiService.getQuote(request);
      setLastQuote(quote);
      
      return quote;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get swap quote');
      setError(error);
      showError('Quote Error', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get swap transaction
  const getSwapTransaction = useCallback(async (request: SwapTransactionRequest): Promise<TransactionResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await swapApiService.getSwapTransaction(request);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get swap transaction');
      setError(error);
      showError('Transaction Error', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    lastQuote,
    getQuote,
    getSwapTransaction,
  };
}