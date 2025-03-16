import { Transaction } from '@solana/web3.js';

// Transaction status types
export type TransactionStatus = 'none' | 'processing' | 'success' | 'error';

// Transaction information
export interface TransactionInfo {
  signature?: string;
  status: TransactionStatus;
  error?: string;
}

// Market information for a swap route
export interface MarketInfo {
  id: string | number;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
}

// Swap route information
export interface SwapRoute {
  marketInfos: MarketInfo[];
  inAmount: string;
  outAmount: string;
  amount: string;
  otherAmountThreshold: string;
  swapMode: string;
  priceImpactPct: number;
  slippageBps: number;
  platformFee: {
    amount: string;
    feeBps: number;
  };
}

// Swap quote response from Jupiter API
export interface SwapQuoteResponse {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: number;
  routePlan: {
    swapInfo: {
      amountIn: string;
      amountOut: string;
      inputMint: string;
      outputMint: string;
      sourceLabel: string;
      sourcePct: number;
    }[];
  }[];
  outAmount: string;
  contextSlot: number;
}

// Transaction request parameters
export interface TransactionRequestParams {
  quoteResponse: SwapQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
}

// Transaction response
export interface TransactionResponse {
  swapTransaction: string; // Serialized transaction
}

// Wallet request for signing transactions
export interface WalletSigningRequest {
  publicKey: string | undefined;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}