// src/hooks/use-swap.hook.ts
import { useState, useCallback } from 'react';
import { swapService } from '@/services/swap.service';
import { SwapQuoteResponse, TransactionResponse } from '@/types/swap.types';
import { TokenInfo } from '@/types/token.types';
import { Transaction } from '@solana/web3.js';
import { debounce } from '@/utils/debounce.util';

interface UseSwapResult {
  isLoading: boolean;
  error: Error | null;
  lastQuote: SwapQuoteResponse | null;
  estimatedOutput: number;
  priceImpact: number;
  transactionSignature: string | null;
  isConfirming: boolean;
  isConfirmed: boolean;
  getQuote: (fromToken: TokenInfo, toToken: TokenInfo, amount: number, slippage: number) => Promise<SwapQuoteResponse>;
  executeSwap: (quoteResponse: SwapQuoteResponse, walletPublicKey: string, signTransaction: (transaction: Transaction) => Promise<Transaction>) => Promise<string>;
  getSwapTransaction: (quoteResponse: SwapQuoteResponse, walletPublicKey: string) => Promise<TransactionResponse>;
  confirmTransaction: (signature: string) => Promise<boolean>;
  reset: () => void;
}

export function useSwap(): UseSwapResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastQuote, setLastQuote] = useState<SwapQuoteResponse | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<number>(0);
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  // Reset all swap state
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setLastQuote(null);
    setEstimatedOutput(0);
    setPriceImpact(0);
    setTransactionSignature(null);
    setIsConfirming(false);
    setIsConfirmed(false);
  }, []);

  // Get swap quote with debounce
  const debouncedGetQuote = useCallback(
    debounce(async (
      fromToken: TokenInfo, 
      toToken: TokenInfo, 
      amount: number, 
      slippage: number,
      setLoadingFn: (loading: boolean) => void,
      setQuoteFn: (quote: SwapQuoteResponse | null) => void,
      setOutputFn: (output: number) => void,
      setPriceFn: (price: number) => void,
      setErrorFn: (error: Error | null) => void
    ) => {
      try {
        if (!fromToken || !toToken || amount <= 0) {
          setQuoteFn(null);
          setOutputFn(0);
          setPriceFn(0);
          return null;
        }
        
        const quoteResponse = await swapService.getSwapQuote(
          fromToken,
          toToken,
          amount,
          slippage
        );
        
        // Calculate output amount in token units
        const outputAmount = swapService.calculateOutputAmount(quoteResponse, toToken);
        
        // Set values
        setQuoteFn(quoteResponse);
        setOutputFn(outputAmount);
        setPriceFn(quoteResponse.priceImpactPct);
        
        return quoteResponse;
      } catch (error) {
        console.error('Failed to get swap quote:', error);
        setErrorFn(error instanceof Error ? error : new Error('Failed to get swap quote'));
        setQuoteFn(null);
        setOutputFn(0);
        setPriceFn(0);
        return null;
      } finally {
        setLoadingFn(false);
      }
    }, 500),
    []
  );

  // Get swap quote
  const getQuote = useCallback(async (
    fromToken: TokenInfo,
    toToken: TokenInfo,
    amount: number,
    slippage: number
  ): Promise<SwapQuoteResponse> => {
    setIsLoading(true);
    setError(null);
    
    // For immediate feedback
    try {
      // Call the swap service directly for synchronous operation
      // rather than using the debounced function which returns void
      const quoteResponse = await swapService.getSwapQuote(
        fromToken,
        toToken,
        amount,
        slippage
      );
      
      // Calculate output amount in token units
      const outputAmount = swapService.calculateOutputAmount(quoteResponse, toToken);
      
      // Set state values
      setLastQuote(quoteResponse);
      setEstimatedOutput(outputAmount);
      setPriceImpact(quoteResponse.priceImpactPct);
      setIsLoading(false);
      
      return quoteResponse;
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      const processedError = error instanceof Error ? error : new Error('Failed to get swap quote');
      setError(processedError);
      setIsLoading(false);
      throw processedError;
    }
  }, []);

  // Get swap transaction
  const getSwapTransaction = useCallback(async (
    quoteResponse: SwapQuoteResponse,
    walletPublicKey: string
  ): Promise<TransactionResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const transactionResponse = await swapService.getSwapTransaction(
        quoteResponse, 
        walletPublicKey
      );
      
      return transactionResponse;
    } catch (error) {
      console.error('Failed to get swap transaction:', error);
      const processedError = error instanceof Error ? error : new Error('Failed to get swap transaction');
      setError(processedError);
      throw processedError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute swap
  const executeSwap = useCallback(async (
    quoteResponse: SwapQuoteResponse,
    walletPublicKey: string,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      setTransactionSignature(null);
      setIsConfirming(false);
      setIsConfirmed(false);
      
      const signature = await swapService.executeSwap(
        quoteResponse,
        walletPublicKey,
        signTransaction
      );
      
      setTransactionSignature(signature);
      setIsConfirming(true);
      
      return signature;
    } catch (error) {
      console.error('Failed to execute swap:', error);
      const processedError = error instanceof Error ? error : new Error('Failed to execute swap');
      setError(processedError);
      throw processedError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Confirm transaction
  const confirmTransaction = useCallback(async (signature: string): Promise<boolean> => {
    try {
      setIsConfirming(true);
      
      const success = await swapService.confirmTransaction(signature);
      
      setIsConfirmed(success);
      setIsConfirming(false);
      
      return success;
    } catch (error) {
      console.error('Failed to confirm transaction:', error);
      setIsConfirmed(false);
      setIsConfirming(false);
      return false;
    }
  }, []);

  return {
    isLoading,
    error,
    lastQuote,
    estimatedOutput,
    priceImpact,
    transactionSignature,
    isConfirming,
    isConfirmed,
    getQuote,
    executeSwap,
    getSwapTransaction,
    confirmTransaction,
    reset
  };
}