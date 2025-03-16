import { SwapQuoteResponse, TransactionResponse } from '@/types/swap.types';

// API request parameters
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

// API error response
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}