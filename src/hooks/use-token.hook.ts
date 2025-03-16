// src/hooks/use-token.hook.ts
import { useState, useCallback, useEffect } from 'react';
import { TokenInfo } from '@/types/token.types';
import { tokenService } from '@/services/token.service';
import { POPULAR_TOKEN_ADDRESSES } from '@/constants/token.constants';

interface UseTokenResult {
  tokens: TokenInfo[];
  popularTokens: TokenInfo[];
  isLoading: boolean;
  error: Error | null;
  getTokenBySymbol: (symbol: string) => TokenInfo | undefined;
  getTokenByAddress: (address: string) => TokenInfo | undefined;
  fetchTokens: (forceRefresh?: boolean) => Promise<TokenInfo[]>;
  fetchTokenBalances: (walletAddress: string) => Promise<void>;
}

export function useToken(): UseTokenResult {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Get token by symbol
  const getTokenBySymbol = useCallback(
    (symbol: string) => tokens.find(token => token.symbol === symbol),
    [tokens]
  );

  // Get token by address
  const getTokenByAddress = useCallback(
    (address: string) => tokens.find(token => token.address === address),
    [tokens]
  );

  // Get popular tokens
  const popularTokens = tokens.filter(token => 
    POPULAR_TOKEN_ADDRESSES.includes(token.address)
  );

  // Fetch all tokens
  const fetchTokens = useCallback(async (forceRefresh = false): Promise<TokenInfo[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedTokens = await tokenService.getTokens(forceRefresh);
      setTokens(fetchedTokens);
      
      return fetchedTokens;
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch tokens'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch token balances for a wallet
  const fetchTokenBalances = useCallback(async (walletAddress: string): Promise<void> => {
    if (!walletAddress) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Make sure tokens are loaded first
      if (tokens.length === 0) {
        await fetchTokens();
      }
      
      // Get balances and update tokens with balance info
      const balances = await tokenService.getTokenBalances(walletAddress);
      
      setTokens(prevTokens => 
        prevTokens.map(token => ({
          ...token,
          balance: balances[token.address] || 0
        }))
      );
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch token balances'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchTokens, tokens.length]);

  // Fetch tokens on first load
  useEffect(() => {
    if (tokens.length === 0 && !isLoading) {
      fetchTokens().catch(console.error);
    }
  }, [fetchTokens, isLoading, tokens.length]);

  return {
    tokens,
    popularTokens,
    isLoading,
    error,
    getTokenBySymbol,
    getTokenByAddress,
    fetchTokens,
    fetchTokenBalances,
  };
}