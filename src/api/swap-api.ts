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

const SWAP_API_URL = 'https://api.jup.ag/swap/v1';
const API_KEY = process.env.NEXT_PUBLIC_SWAPS_API_KEY || '';

const API_STATE = {
  lastQuoteFetchTime: 0,
  lastTxFetchTime: 0,
  isQuoteFetchInProgress: false,
  isTxFetchInProgress: false,
  MAX_RETRY_INTERVAL: 1000,
};

function timeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Gets a swap quote with timeout and error handling
 */
export async function getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
  try {
    if (API_STATE.isQuoteFetchInProgress) {
      if (Date.now() - API_STATE.lastQuoteFetchTime < 5000) {
        throw new Error('Another quote fetch is already in progress. Please try again in a moment.');
      } else {
        API_STATE.isQuoteFetchInProgress = false;
      }
    }
    
    API_STATE.isQuoteFetchInProgress = true;
    API_STATE.lastQuoteFetchTime = Date.now();
    
    const slippageBps = Math.round(request.slippageBps * 100);
    
    const url = new URL(`${SWAP_API_URL}/quote`);
    url.searchParams.set('inputMint', request.inputMint);
    url.searchParams.set('outputMint', request.outputMint);
    url.searchParams.set('amount', request.amount.toString());
    url.searchParams.set('slippageBps', slippageBps.toString());
    
    if (request.onlyDirectRoutes) {
      url.searchParams.set('onlyDirectRoutes', 'true');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    
    const response = await timeoutPromise(
      fetch(url.toString(), { headers }),
      10000
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
 * Gets a swap transaction with timeout and error handling
 */
export async function getSwapTransaction(request: TransactionRequest): Promise<TransactionResponse> {
  try {
    if (API_STATE.isTxFetchInProgress) {
      if (Date.now() - API_STATE.lastTxFetchTime < 5000) {
        throw new Error('Another transaction fetch is already in progress. Please try again in a moment.');
      } else {
        API_STATE.isTxFetchInProgress = false;
      }
    }
    
    API_STATE.isTxFetchInProgress = true;
    API_STATE.lastTxFetchTime = Date.now();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    
    const response = await timeoutPromise(
      fetch(`${SWAP_API_URL}/swap`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          quoteResponse: request.quoteResponse,
          userPublicKey: request.userPublicKey,
          wrapAndUnwrapSol: request.wrapAndUnwrapSol !== false
        })
      }),
      15000
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