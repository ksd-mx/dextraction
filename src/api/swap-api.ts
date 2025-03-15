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

// API call tracking to prevent excessive calls
const API_STATE = {
  lastQuoteFetchTime: 0,
  lastTxFetchTime: 0,
  isQuoteFetchInProgress: false,
  isTxFetchInProgress: false,
  MAX_RETRY_INTERVAL: 1000, // 1 second
};

// Timeout promise to prevent hanging requests
function timeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Gets a swap quote from Jupiter with timeout and error handling
 */
export async function getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
  try {
    // Rate limiting prevention
    if (API_STATE.isQuoteFetchInProgress) {
      if (Date.now() - API_STATE.lastQuoteFetchTime < 5000) {
        throw new Error('Another quote fetch is already in progress. Please try again in a moment.');
      } else {
        // Reset the state if it's been stuck for too long
        API_STATE.isQuoteFetchInProgress = false;
      }
    }
    
    API_STATE.isQuoteFetchInProgress = true;
    API_STATE.lastQuoteFetchTime = Date.now();
    
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
    
    // Add timeout to prevent hanging requests
    const response = await timeoutPromise(
      fetch(url.toString()),
      10000 // 10 second timeout
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get swap quote: ${response.statusText}`);
    }
    
    const data = await response.json();
    API_STATE.isQuoteFetchInProgress = false;
    return data;
  } catch (error) {
    API_STATE.isQuoteFetchInProgress = false;
    console.error('Error getting swap quote:', error);
    throw error;
  }
}

/**
 * Gets a swap transaction from Jupiter with timeout and error handling
 */
export async function getSwapTransaction(request: TransactionRequest): Promise<TransactionResponse> {
  try {
    // Rate limiting prevention
    if (API_STATE.isTxFetchInProgress) {
      if (Date.now() - API_STATE.lastTxFetchTime < 5000) {
        throw new Error('Another transaction fetch is already in progress. Please try again in a moment.');
      } else {
        // Reset the state if it's been stuck for too long
        API_STATE.isTxFetchInProgress = false;
      }
    }
    
    API_STATE.isTxFetchInProgress = true;
    API_STATE.lastTxFetchTime = Date.now();
    
    // Add timeout to prevent hanging requests
    const response = await timeoutPromise(
      fetch(`${JUPITER_API_V6}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse: request.quoteResponse,
          userPublicKey: request.userPublicKey,
          wrapAndUnwrapSol: request.wrapAndUnwrapSol !== false
        })
      }),
      15000 // 15 second timeout for transaction
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get swap transaction: ${response.statusText}`);
    }
    
    const data = await response.json();
    API_STATE.isTxFetchInProgress = false;
    return data;
  } catch (error) {
    API_STATE.isTxFetchInProgress = false;
    console.error('Error getting swap transaction:', error);
    throw error;
  }
}