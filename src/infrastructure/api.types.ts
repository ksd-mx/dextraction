// src/infrastructure/api/api.types.ts
import { TokenInfo } from '@/types/token.types';
import { SwapQuoteResponse, TransactionResponse } from '@/types/swap.types';

/**
 * Token API request and response interfaces
 */
export interface GetTokensParams {
  chainId?: string;       // Chain ID to filter tokens by
  includePrice?: boolean; // Whether to include token prices
  popular?: boolean;      // Get only popular tokens
}

export interface GetTokenPricesParams {
  chainId?: string;        // Chain ID to filter prices by
  addresses?: string[];    // Token addresses to get prices for
}

export interface GetTokenBalancesParams {
  chainId?: string;       // Chain ID to filter balances by
  walletAddress: string;  // Wallet address to get balances for
}

export interface TokenListResponse {
  tokens: TokenInfo[];
}

export interface TokenPricesResponse {
  prices: Record<string, number>; // Map of token address to price
}

export interface TokenBalancesResponse {
  balances: Record<string, number>; // Map of token address to balance
}

/**
 * Swap API request and response interfaces
 */
export interface SwapQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
  onlyDirectRoutes?: boolean;
}

export interface SwapTransactionRequest {
  quoteResponse: SwapQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}