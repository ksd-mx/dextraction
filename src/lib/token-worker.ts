import { config } from './config';

/**
 * Web Worker for handling token data processing in the background
 * This prevents the main thread from being blocked during intensive operations
 */

// Define the types of messages this worker can receive
type WorkerMessageType = 
  | 'FETCH_TOKENS'
  | 'FETCH_PRICES'
  | 'FILTER_TOKENS'
  | 'SORT_TOKENS';

interface WorkerMessage {
  type: WorkerMessageType;
  payload?: any;
}

// Setup event listener for messages from the main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'FETCH_TOKENS':
      await fetchTokens();
      break;
    case 'FETCH_PRICES':
      await fetchPrices(payload.tokens);
      break;
    case 'FILTER_TOKENS':
      filterTokens(payload.tokens, payload.query, payload.favoriteTokens, payload.popularTokens);
      break;
    case 'SORT_TOKENS':
      sortTokens(payload.tokens, payload.favoriteTokens, payload.popularTokens);
      break;
    default:
      console.error('Unknown message type:', type);
  }
});

/**
 * Fetches token list from CoinGecko API
 */
async function fetchTokens(): Promise<void> {
  try {
    self.postMessage({ type: 'STATUS', payload: { status: 'LOADING_TOKENS' } });
    
    // Fetch token list from CoinGecko
    const response = await fetch(
      `${config.tokens.apiUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${config.tokens.maxTokensPerRequest}&page=1`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }
    
    const coingeckoTokens = await response.json();
    const formattedTokens = coingeckoTokens.map((token: any) => ({
      address: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      decimals: 18,
      logoURI: token.image,
      price: token.current_price,
      marketCap: token.market_cap,
      volume: token.total_volume
    }));
    
    self.postMessage({ 
      type: 'TOKENS_LOADED', 
      payload: { tokens: formattedTokens } 
    });
    
    // Now fetch prices from Jupiter (swaps remain there)
    await fetchPrices(formattedTokens);
    
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      payload: { 
        error: error instanceof Error ? error.message : 'Unknown error fetching tokens',
        phase: 'FETCH_TOKENS'
      } 
    });
  }
}

/**
 * Fetches token prices from Jupiter API
 */
async function fetchPrices(tokens: any[]): Promise<void> {
  try {
    self.postMessage({ type: 'STATUS', payload: { status: 'LOADING_PRICES' } });
    
    const response = await fetch(`${config.swaps.apiUrl}/v4/price`);
    if (!response.ok) {
      throw new Error(`Failed to fetch token prices: ${response.statusText}`);
    }
    
    const data = await response.json();
    const priceMap: Record<string, number> = {};
    
    if (data && data.data) {
      Object.entries(data.data).forEach(([mint, priceData]) => {
        if (typeof priceData === 'object' && priceData !== null && 'price' in priceData) {
          priceMap[mint] = (priceData as { price: number }).price;
        }
      });
    }
    
    // Combine tokens with prices
    const tokensWithPrices = tokens.map((token: any) => ({
      ...token,
      price: priceMap[token.address] || 0,
      balance: 0
    }));
    
    self.postMessage({
      type: 'PRICES_LOADED',
      payload: {
        tokens: tokensWithPrices,
        priceMap
      }
    });
    
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      payload: { 
        error: error instanceof Error ? error.message : 'Unknown error fetching prices',
        phase: 'FETCH_PRICES'
      } 
    });
  }
}

/**
 * Filters tokens based on search query
 */
function filterTokens(
  tokens: any[],
  query: string,
  favoriteTokens: string[] = [],
  popularTokens: string[] = []
): void {
  self.postMessage({ type: 'STATUS', payload: { status: 'FILTERING' } });
  
  const lowerQuery = query.toLowerCase().trim();
  
  // Skip filtering if the query is empty
  if (!lowerQuery) {
    self.postMessage({
      type: 'TOKENS_FILTERED',
      payload: { tokens }
    });
    return;
  }
  
  const filtered = tokens.filter((token: any) => {
    return (
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery) ||
      token.address.toLowerCase() === lowerQuery
    );
  });
  
  // Sort filtered results: favorites > popular > balance > alphabetical
  const sortedFiltered = [...filtered].sort((a: any, b: any) => {
    // First by favorites
    const aIsFavorite = favoriteTokens.includes(a.address);
    const bIsFavorite = favoriteTokens.includes(b.address);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // Then by popular
    const aIsPopular = popularTokens.includes(a.address);
    const bIsPopular = popularTokens.includes(b.address);
    if (aIsPopular && !bIsPopular) return -1;
    if (!aIsPopular && bIsPopular) return 1;
    
    // Then by balance
    if (a.balance > 0 && b.balance === 0) return -1;
    if (a.balance === 0 && b.balance > 0) return 1;
    
    // Finally by symbol
    return a.symbol.localeCompare(b.symbol);
  });
  
  self.postMessage({
    type: 'TOKENS_FILTERED',
    payload: { tokens: sortedFiltered }
  });
}

/**
 * Sorts tokens by favorites, popularity, and balance
 */
function sortTokens(
  tokens: any[],
  favoriteTokens: string[] = [],
  popularTokens: string[] = []
): void {
  self.postMessage({ type: 'STATUS', payload: { status: 'SORTING' } });
  
  const sorted = [...tokens].sort((a: any, b: any) => {
    // First by favorites
    const aIsFavorite = favoriteTokens.includes(a.address);
    const bIsFavorite = favoriteTokens.includes(b.address);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // Then by popular
    const aIsPopular = popularTokens.includes(a.address);
    const bIsPopular = popularTokens.includes(b.address);
    if (aIsPopular && !bIsPopular) return -1;
    if (!aIsPopular && bIsPopular) return 1;
    
    // Then by balance
    if (a.balance > 0 && b.balance === 0) return -1;
    if (a.balance === 0 && b.balance > 0) return 1;
    
    // Finally by symbol
    return a.symbol.localeCompare(b.symbol);
  });
  
  self.postMessage({
    type: 'TOKENS_SORTED',
    payload: { tokens: sorted }
  });
}

// Let the main thread know the worker is ready
self.postMessage({ type: 'READY' });