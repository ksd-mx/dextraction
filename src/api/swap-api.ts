// Interface for swap quote request
export interface SwapQuoteRequest {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps: number;
    onlyDirectRoutes?: boolean;
  }
  
  // Interface for swap quote response
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
  
  // Interface for the transaction request
  export interface TransactionRequest {
    quoteResponse: SwapQuoteResponse;
    userPublicKey: string;
    wrapAndUnwrapSol?: boolean;
  }
  
  // Interface for the transaction response
  export interface TransactionResponse {
    swapTransaction: string; // Serialized transaction
  }
  
  const JUPITER_API_V6 = 'https://quote-api.jup.ag/v6';
  
  /**
   * Gets a swap quote from Jupiter
   */
  export async function getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    try {
      // Convert slippage from percentage to basis points (1% = 100 basis points)
      const slippageBps = Math.round(request.slippageBps * 100);
      
      // Build the URL with query parameters
      const url = new URL(`${JUPITER_API_V6}/quote`);
      url.searchParams.set('inputMint', request.inputMint);
      url.searchParams.set('outputMint', request.outputMint);
      url.searchParams.set('amount', request.amount.toString());
      url.searchParams.set('slippageBps', slippageBps.toString());
      
      if (request.onlyDirectRoutes) {
        url.searchParams.set('onlyDirectRoutes', 'true');
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to get swap quote: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw error;
    }
  }
  
  /**
   * Gets a swap transaction from Jupiter
   */
  export async function getSwapTransaction(request: TransactionRequest): Promise<TransactionResponse> {
    try {
      const response = await fetch(`${JUPITER_API_V6}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse: request.quoteResponse,
          userPublicKey: request.userPublicKey,
          wrapAndUnwrapSol: request.wrapAndUnwrapSol !== false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get swap transaction: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      throw error;
    }
  }