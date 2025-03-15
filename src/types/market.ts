export interface MarketInfo {
  id: string | number;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
}

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

// Route information for swap
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
