import { TokenInfo } from '@/types/token.types';

// API request parameters
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

// API response types
export interface TokenListResponse {
  tokens: TokenInfo[];
}

export interface TokenPricesResponse {
  prices: Record<string, number>; // Map of token address to price
}

export interface TokenBalancesResponse {
  balances: Record<string, number>; // Map of token address to balance
}

// API error response
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}