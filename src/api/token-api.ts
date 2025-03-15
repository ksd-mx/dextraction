import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '@/lib/config';
import { TokenInfo } from '@/types/token';
import { 
  getTokensFromCache, 
  getPricesFromCache, 
  saveTokensToCache, 
  savePricesToCache 
} from '@/lib/indexed-db-storage';

// Jupiter token interface
interface JupiterToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI: string;
  tags?: string[];
}

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  TOKEN_LIST: 1000 * 60 * 60 * 24, // 24 hours
  TOKEN_PRICES: 1000 * 60, // 1 minute
};

// API call tracking to prevent excessive calls
const API_STATE = {
  lastTokenFetchTime: 0,
  lastPriceFetchTime: 0,
  isTokenFetchInProgress: false,
  isPriceFetchInProgress: false,
  tokenFetchRetries: 0,
  priceFetchRetries: 0,
  MAX_RETRIES: 3,
  MIN_RETRY_INTERVAL: 5000, // 5 seconds
};

/**
 * Safely fetches data with error handling and retry limits
 */
async function safeFetch(url: string, options = {}): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}

/**
 * Fetches token list and prices in parallel with proper error handling
 */
export async function fetchTokensWithPrices(): Promise<TokenInfo[]> {
  try {
    // Circuit breaker: If fetching is in progress, don't start another fetch
    if (API_STATE.isTokenFetchInProgress) {
      console.log('Token fetch already in progress, skipping duplicate request');
      
      // If fetch has been stuck for more than 10 seconds, we have a problem
      if (Date.now() - API_STATE.lastTokenFetchTime > 10000) {
        console.warn('Token fetch appears to be stuck, attempting to reset state');
        API_STATE.isTokenFetchInProgress = false;
      } else {
        // Return cached tokens if available, otherwise return empty array
        const cachedTokens = await getTokensFromCache();
        return cachedTokens || [];
      }
    }
    
    // Set fetch in progress flag
    API_STATE.isTokenFetchInProgress = true;
    API_STATE.lastTokenFetchTime = Date.now();
    
    // Try to get token list from IndexedDB cache
    const cachedTokens = await getTokensFromCache();
    
    // Check if we have a valid cached token list
    if (cachedTokens && cachedTokens.length > 0) {
      console.log('Using cached token list from IndexedDB');
      
      // Even if we have cached tokens, we should refresh prices
      // but don't block the UI - return cached data immediately
      API_STATE.isTokenFetchInProgress = false;
      refreshTokenPrices(cachedTokens).catch(console.error);
      
      return cachedTokens;
    }
    
    // Rate limiting: Don't retry too quickly
    if (
      API_STATE.tokenFetchRetries > 0 && 
      Date.now() - API_STATE.lastTokenFetchTime < API_STATE.MIN_RETRY_INTERVAL
    ) {
      console.log('Rate limiting token fetch, using cached data');
      API_STATE.isTokenFetchInProgress = false;
      return cachedTokens || [];
    }
    
    // If we've exceeded max retries, use cached data or return empty array
    if (API_STATE.tokenFetchRetries >= API_STATE.MAX_RETRIES) {
      console.error('Maximum token fetch retries exceeded, using cached data');
      API_STATE.isTokenFetchInProgress = false;
      return cachedTokens || [];
    }
    
    // Increment retry counter
    API_STATE.tokenFetchRetries++;
    
    // Performance optimization: Start network requests early with timeouts
    const tokensPromise = safeFetch('https://token.jup.ag/all')
      .catch(error => {
        console.error('Failed to fetch tokens:', error);
        return null;
      });
    
    const pricesPromise = safeFetch('https://price.jup.ag/v4/price')
      .catch(error => {
        console.error('Failed to fetch token prices:', error);
        return null;
      });
    
    // Wait for both requests to complete with a timeout
    const [tokensResponse, pricesResponse] = await Promise.all([
      tokensPromise,
      pricesPromise
    ]);
    
    // Handle failed token fetch
    if (!tokensResponse) {
      console.error('Token fetch failed, using cached data');
      API_STATE.isTokenFetchInProgress = false;
      return cachedTokens || [];
    }
    
    // Parse JSON responses
    let jupiterTokens;
    try {
      jupiterTokens = await tokensResponse.json();
    } catch (error) {
      console.error('Error parsing token data:', error);
      API_STATE.isTokenFetchInProgress = false;
      return cachedTokens || [];
    }
    
    // Extract price map (handle failure gracefully)
    const priceMap: Record<string, number> = {};
    
    if (pricesResponse) {
      try {
        const priceData = await pricesResponse.json();
        if (priceData && priceData.data) {
          Object.entries(priceData.data).forEach(([mint, data]) => {
            if (typeof data === 'object' && data !== null && 'price' in data) {
              priceMap[mint] = (data as { price: number }).price;
            }
          });
        }
      } catch (error) {
        console.error('Error parsing price data:', error);
        // Continue with empty price map
      }
    }
    
    // Map Jupiter tokens to our token format with prices
    const tokensWithPrices = jupiterTokens.map((token: JupiterToken) => ({
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
      logoURI: token.logoURI,
      price: priceMap[token.address] || 0,
      balance: 0, // Will be populated later
      tags: token.tags || []
    }));
    
    // Cache the result using IndexedDB (don't block on this)
    Promise.all([
      saveTokensToCache(tokensWithPrices, CACHE_EXPIRY.TOKEN_LIST),
      savePricesToCache(priceMap, CACHE_EXPIRY.TOKEN_PRICES)
    ]).catch(error => {
      console.error('Error caching token data:', error);
    });
    
    // Reset retry counter on success
    API_STATE.tokenFetchRetries = 0;
    API_STATE.isTokenFetchInProgress = false;
    
    return tokensWithPrices;
  } catch (error) {
    console.error('Error fetching tokens with prices:', error);
    API_STATE.isTokenFetchInProgress = false;
    
    // Return cached tokens if available, otherwise empty array
    const cachedTokens = await getTokensFromCache();
    return cachedTokens || [];
  }
}

/**
 * Refreshes token prices without blocking the UI
 */
export async function refreshTokenPrices(tokens: TokenInfo[]): Promise<Record<string, number>> {
  try {
    // Circuit breaker: Don't run multiple price refreshes at once
    if (API_STATE.isPriceFetchInProgress) {
      console.log('Price fetch already in progress, skipping duplicate request');
      return {};
    }
    
    // Rate limiting: Don't retry too quickly
    if (
      API_STATE.priceFetchRetries > 0 && 
      Date.now() - API_STATE.lastPriceFetchTime < API_STATE.MIN_RETRY_INTERVAL
    ) {
      console.log('Rate limiting price fetch');
      return {};
    }
    
    // Set fetch in progress flag
    API_STATE.isPriceFetchInProgress = true;
    API_STATE.lastPriceFetchTime = Date.now();
    
    // Try to get prices from IndexedDB cache first
    const cachedPrices = await getPricesFromCache();
    
    // Check if we have valid cached prices and use them immediately
    if (cachedPrices && Object.keys(cachedPrices).length > 0) {
      console.log('Using cached prices from IndexedDB');
      
      // Update tokens with cached prices
      tokens.forEach(token => {
        if (cachedPrices[token.address]) {
          token.price = cachedPrices[token.address];
        }
      });
      
      // If we're within the retry limit, fetch fresh prices in the background
      if (API_STATE.priceFetchRetries < API_STATE.MAX_RETRIES) {
        API_STATE.priceFetchRetries++;
        
        // Fetch fresh prices in the background without blocking UI
        setTimeout(async () => {
          try {
            const response = await safeFetch('https://price.jup.ag/v4/price');
            const data = await response.json();
            const freshPrices: Record<string, number> = {};
            
            if (data && data.data) {
              Object.entries(data.data).forEach(([mint, priceData]) => {
                if (typeof priceData === 'object' && priceData !== null && 'price' in priceData) {
                  freshPrices[mint] = (priceData as { price: number }).price;
                }
              });
              
              // Update token prices in-place
              tokens.forEach(token => {
                if (freshPrices[token.address]) {
                  token.price = freshPrices[token.address];
                }
              });
              
              // Cache the fresh prices
              await savePricesToCache(freshPrices, CACHE_EXPIRY.TOKEN_PRICES);
              
              // Reset retry counter on success
              API_STATE.priceFetchRetries = 0;
            }
          } catch (error) {
            console.error('Background price refresh failed:', error);
          } finally {
            API_STATE.isPriceFetchInProgress = false;
          }
        }, 0);
      } else {
        API_STATE.isPriceFetchInProgress = false;
      }
      
      return cachedPrices;
    }
    
    // If no cached prices, fetch them with a timeout
    let priceResponse;
    try {
      priceResponse = await safeFetch('https://price.jup.ag/v4/price');
    } catch (error) {
      console.error('Error fetching token prices:', error);
      API_STATE.isPriceFetchInProgress = false;
      return {};
    }
    
    // Parse price data
    const priceMap: Record<string, number> = {};
    try {
      const data = await priceResponse.json();
      
      if (data && data.data) {
        Object.entries(data.data).forEach(([mint, priceData]) => {
          if (typeof priceData === 'object' && priceData !== null && 'price' in priceData) {
            priceMap[mint] = (priceData as { price: number }).price;
          }
        });
        
        // Update token prices in-place
        tokens.forEach(token => {
          if (priceMap[token.address]) {
            token.price = priceMap[token.address];
          }
        });
        
        // Cache the result in IndexedDB
        await savePricesToCache(priceMap, CACHE_EXPIRY.TOKEN_PRICES);
        
        // Reset retry counter on success
        API_STATE.priceFetchRetries = 0;
      }
    } catch (error) {
      console.error('Error processing price data:', error);
      API_STATE.priceFetchRetries++;
    } finally {
      API_STATE.isPriceFetchInProgress = false;
    }
    
    return priceMap;
  } catch (error) {
    console.error('Error refreshing token prices:', error);
    API_STATE.isPriceFetchInProgress = false;
    return {};
  }
}

/**
 * Gets token balances for a wallet - optimized to prioritize important tokens
 */
export async function getTokenBalances(
  walletAddress: string, 
  tokens: TokenInfo[],
  priority: string[] = [] // Optional array of token addresses to prioritize
): Promise<Map<string, number>> {
  try {
    const connection = new Connection(config.solana.rpcUrl, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: true // Prevent excessive retries
    });
    
    // Validate wallet address
    let publicKey;
    try {
      publicKey = new PublicKey(walletAddress);
    } catch (error) {
      console.error('Invalid wallet address:', error);
      return new Map<string, number>();
    }
    
    // Start the SOL balance request immediately for parallelism
    const solBalancePromise = connection.getBalance(publicKey)
      .catch(error => {
        console.error('Error fetching SOL balance:', error);
        return 0;
      });
    
    // Start token accounts request in parallel with timeout
    const tokenAccountsPromise = connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    ).catch(error => {
      console.error('Error fetching token accounts:', error);
      return { value: [] };
    });
    
    // Wait for both promises to resolve
    const [solBalance, tokenAccounts] = await Promise.all([
      solBalancePromise,
      tokenAccountsPromise
    ]);
    
    const solBalanceInSOL = solBalance / 1_000_000_000; // Convert lamports to SOL
    const balanceMap = new Map<string, number>();
    
    // Add native SOL
    const solToken = tokens.find(t => t.symbol === 'SOL');
    if (solToken) {
      balanceMap.set(solToken.address, solBalanceInSOL);
      solToken.balance = solBalanceInSOL;
    }
    
    // Create a map for quick token lookup using address
    const tokenMap = new Map<string, TokenInfo>();
    tokens.forEach(token => tokenMap.set(token.address, token));
    
    // Process token accounts - note we process all of them at once for efficiency
    for (const { account } of tokenAccounts.value) {
      try {
        const parsedInfo = account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const balance = parsedInfo.tokenAmount.uiAmount;
        
        if (balance > 0) {
          balanceMap.set(mintAddress, balance);
          
          // Update token balance in the token array directly
          const token = tokenMap.get(mintAddress);
          if (token) {
            token.balance = balance;
          }
        }
      } catch (e) {
        console.warn('Error processing token account:', e);
        // Continue with other accounts
      }
    }
    
    return balanceMap;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return new Map<string, number>();
  }
}

/**
 * Updates all token balances at once using the most efficient RPC call
 * This avoids multiple RPC calls and improves performance
 */
export async function batchUpdateTokenBalances(
  walletAddress: string,
  tokens: TokenInfo[]
): Promise<void> {
  try {
    // Validate wallet address
    let publicKey;
    try {
      publicKey = new PublicKey(walletAddress);
    } catch (error) {
      console.error('Invalid wallet address:', error);
      return;
    }
    
    const connection = new Connection(config.solana.rpcUrl, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: true
    });
    
    // Create a token lookup map for quick access
    const tokenMap = new Map<string, TokenInfo>();
    tokens.forEach(token => tokenMap.set(token.address, token));
    
    // Start both requests in parallel with error handling
    const solBalancePromise = connection.getBalance(publicKey)
      .catch(error => {
        console.error('Error fetching SOL balance:', error);
        return 0;
      });
    
    const accountsPromise = connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    ).catch(error => {
      console.error('Error fetching token accounts:', error);
      return { value: [] };
    });
    
    // Wait for both to complete
    const [solBalance, accounts] = await Promise.all([
      solBalancePromise,
      accountsPromise
    ]);
    
    // Update SOL balance
    const solBalanceInSOL = solBalance / 1_000_000_000;
    const solToken = tokens.find(t => t.symbol === 'SOL');
    if (solToken) {
      solToken.balance = solBalanceInSOL;
    }
    
    // Reset all non-SOL token balances to zero first
    // This ensures tokens that are no longer held show zero balance
    tokens.forEach(token => {
      if (token.symbol !== 'SOL') {
        token.balance = 0;
      }
    });
    
    // Process all token accounts at once
    accounts.value.forEach(({ account }) => {
      try {
        const parsedInfo = account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const balance = parsedInfo.tokenAmount.uiAmount;
        
        // Only update if balance > 0 and the token exists in our list
        if (balance > 0 && tokenMap.has(mintAddress)) {
          tokenMap.get(mintAddress)!.balance = balance;
        }
      } catch (e) {
        // Skip any problem accounts and continue
        console.warn('Error processing account in batch update:', e);
      }
    });
  } catch (error) {
    console.error('Error in batch updating token balances:', error);
  }
}