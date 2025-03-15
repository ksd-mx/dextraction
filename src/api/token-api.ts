import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '@/lib/config';
import { TokenInfo } from '@/types/token';
import { 
  getTokensFromCache, 
  getPricesFromCache, 
  saveTokensToCache, 
  savePricesToCache 
} from '@/lib/indexed-db-storage';

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  TOKEN_LIST: 24 * 60 * 60 * 1000, // 24 hours
  TOKEN_PRICES: 15 * 60 * 1000,    // 15 minutes
};

// API call tracking to prevent excessive calls
const API_STATE = {
  lastTokenFetchTime: 0,
  lastPriceFetchTime: 0,
  isTokenFetchInProgress: false,
  isPriceFetchInProgress: false,
  MIN_RETRY_INTERVAL: 5000, // 5 seconds
};

// Known Solana tokens to ensure we have a stable set of core tokens
const CORE_SOLANA_TOKENS = [
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png'
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png'
  }
];

/**
 * Safely fetches data with error handling and timeout
 */
async function safeFetch(url: string, options = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timed out');
    }
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetches token list from Jupiter API
 */
async function fetchSolanaTokenList(): Promise<any[]> {
  try {
    const response = await safeFetch(
      'https://token.jup.ag/all'
    );
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching Jupiter token list:', error);
    return [];
  }
}

/**
 * Fetches token prices from CoinGecko
 */
async function fetchTokenPrices(tokenAddresses: string[]): Promise<Record<string, number>> {
  if (tokenAddresses.length === 0) return {};
  
  const BATCH_SIZE = 100;
  const priceMap: Record<string, number> = {};
  
  const processBatch = async (addresses: string[]): Promise<void> => {
    try {
      // Validate addresses
      const validAddresses = addresses.filter(addr => 
        addr && addr.length === 44 && /^[a-zA-Z0-9]+$/.test(addr)
      );
      
      if (validAddresses.length === 0) return;
      
      const url = `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${validAddresses.join(',')}&vs_currencies=usd`;
      const response = await safeFetch(url, {
        headers: {
          'accept': 'application/json',
          'x-cg-demo-api-key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format');
      }
      
      Object.entries(data).forEach(([address, priceData]) => {
        if (priceData && typeof priceData === 'object' && 'usd' in priceData) {
          priceMap[address] = (priceData as { usd: number }).usd;
        }
      });
    } catch (error) {
      console.error('Error fetching token prices batch:', error);
      // Continue with other batches even if one fails
    }
  };
  
  for (let i = 0; i < tokenAddresses.length; i += BATCH_SIZE) {
    const batch = tokenAddresses.slice(i, i + BATCH_SIZE);
    await processBatch(batch);
    
    // Add delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < tokenAddresses.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return priceMap;
}

/**
 * Main function to fetch tokens with prices
 */
export async function fetchTokensWithPrices(): Promise<TokenInfo[]> {
  try {
    if (API_STATE.isTokenFetchInProgress) {
      console.log('Token fetch already in progress, skipping duplicate request');
      
      if (Date.now() - API_STATE.lastTokenFetchTime > 30000) {
        console.warn('Token fetch appears to be stuck, attempting to reset state');
        API_STATE.isTokenFetchInProgress = false;
      } else {
        const cachedTokens = await getTokensFromCache();
        return cachedTokens || CORE_SOLANA_TOKENS.map(token => ({
          ...token,
          price: 0,
          balance: 0,
          tags: []
        }));
      }
    }
    
    const cachedTokens = await getTokensFromCache();
    
    if (cachedTokens && cachedTokens.length > 0) {
      console.log('Using cached token list');
      refreshTokenPrices(cachedTokens).catch(console.error);
      return cachedTokens;
    }
    
    if (Date.now() - API_STATE.lastTokenFetchTime < API_STATE.MIN_RETRY_INTERVAL) {
      console.log('Rate limiting token fetch, using cached data');
      return cachedTokens || CORE_SOLANA_TOKENS.map(token => ({
        ...token,
        price: 0,
        balance: 0,
        tags: []
      }));
    }
    
    API_STATE.isTokenFetchInProgress = true;
    API_STATE.lastTokenFetchTime = Date.now();
    
    const jupiterTokens = await fetchSolanaTokenList();
    
    const tokenAddresses = [
      ...CORE_SOLANA_TOKENS.map(t => t.address),
      ...jupiterTokens.slice(0, 100).map(t => t.address)
    ].filter(Boolean);
    
    const priceMap = await fetchTokenPrices(tokenAddresses);
    
    const tokensWithPrices = jupiterTokens.map((token: any) => ({
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
      logoURI: token.logoURI || '',
      price: priceMap[token.address] || 0,
      balance: 0,
      tags: token.tags || []
    }));
    
    Promise.all([
      saveTokensToCache(tokensWithPrices, CACHE_EXPIRY.TOKEN_LIST),
      savePricesToCache(priceMap, CACHE_EXPIRY.TOKEN_PRICES)
    ]).catch(console.error);
    
    API_STATE.isTokenFetchInProgress = false;
    
    return tokensWithPrices;
  } catch (error) {
    console.error('Error fetching tokens with prices:', error);
    API_STATE.isTokenFetchInProgress = false;
    
    const cachedTokens = await getTokensFromCache();
    if (cachedTokens && cachedTokens.length > 0) return cachedTokens;
    
    return CORE_SOLANA_TOKENS.map(token => ({
      ...token,
      price: 0,
      balance: 0,
      tags: []
    }));
  }
}

/**
 * Refreshes token prices without blocking the UI
 */
export async function refreshTokenPrices(tokens: TokenInfo[]): Promise<Record<string, number>> {
  try {
    if (API_STATE.isPriceFetchInProgress) {
      console.log('Price fetch already in progress, skipping duplicate request');
      return {};
    }
    
    if (Date.now() - API_STATE.lastPriceFetchTime < API_STATE.MIN_RETRY_INTERVAL) {
      console.log('Rate limiting price fetch');
      return {};
    }
    
    const cachedPrices = await getPricesFromCache();
    
    if (cachedPrices && Object.keys(cachedPrices).length > 0) {
      console.log('Using cached prices');
      
      tokens.forEach(token => {
        if (cachedPrices[token.address]) {
          token.price = cachedPrices[token.address];
        }
      });
      
      API_STATE.isPriceFetchInProgress = true;
      API_STATE.lastPriceFetchTime = Date.now();
      
      const tokenAddresses = tokens.slice(0, 100).map(t => t.address).filter(Boolean);
      
      setTimeout(async () => {
        try {
          const freshPrices = await fetchTokenPrices(tokenAddresses);
          
          tokens.forEach(token => {
            if (freshPrices[token.address]) {
              token.price = freshPrices[token.address];
            }
          });
          
          await savePricesToCache(freshPrices, CACHE_EXPIRY.TOKEN_PRICES);
        } catch (error) {
          console.error('Background price refresh failed:', error);
        } finally {
          API_STATE.isPriceFetchInProgress = false;
        }
      }, 0);
      
      return cachedPrices;
    }
    
    API_STATE.isPriceFetchInProgress = true;
    API_STATE.lastPriceFetchTime = Date.now();
    
    const tokenAddresses = tokens.slice(0, 100).map(t => t.address).filter(Boolean);
    const priceMap = await fetchTokenPrices(tokenAddresses);
    
    tokens.forEach(token => {
      if (priceMap[token.address]) {
        token.price = priceMap[token.address];
      }
    });
    
    await savePricesToCache(priceMap, CACHE_EXPIRY.TOKEN_PRICES);
    
    API_STATE.isPriceFetchInProgress = false;
    return priceMap;
  } catch (error) {
    console.error('Error refreshing token prices:', error);
    API_STATE.isPriceFetchInProgress = false;
    return {};
  }
}

/**
 * Gets token balances for a wallet
 */
export async function getTokenBalances(
  walletAddress: string, 
  tokens: TokenInfo[]
): Promise<Map<string, number>> {
  try {
    const connection = new Connection(config.solana.rpcUrl, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: true
    });
    
    let publicKey;
    try {
      publicKey = new PublicKey(walletAddress);
    } catch (error) {
      console.error('Invalid wallet address:', error);
      return new Map<string, number>();
    }
    
    const solBalancePromise = connection.getBalance(publicKey)
      .catch(error => {
        console.error('Error fetching SOL balance:', error);
        return 0;
      });
    
    const tokenAccountsPromise = connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    ).catch(error => {
      console.error('Error fetching token accounts:', error);
      return { value: [] };
    });
    
    const [solBalance, tokenAccounts] = await Promise.all([
      solBalancePromise,
      tokenAccountsPromise
    ]);
    
    const solBalanceInSOL = solBalance / 1_000_000_000;
    const balanceMap = new Map<string, number>();
    
    const solToken = tokens.find(t => t.symbol === 'SOL');
    if (solToken) {
      balanceMap.set(solToken.address, solBalanceInSOL);
      solToken.balance = solBalanceInSOL;
    }
    
    const tokenMap = new Map<string, TokenInfo>();
    tokens.forEach(token => tokenMap.set(token.address, token));
    
    for (const { account } of tokenAccounts.value) {
      try {
        const parsedInfo = account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const balance = parsedInfo.tokenAmount.uiAmount;
        
        if (balance > 0) {
          balanceMap.set(mintAddress, balance);
          
          const token = tokenMap.get(mintAddress);
          if (token) {
            token.balance = balance;
          }
        }
      } catch (e) {
        console.warn('Error processing token account:', e);
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
 */
export async function batchUpdateTokenBalances(
  walletAddress: string,
  tokens: TokenInfo[]
): Promise<void> {
  try {
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
    
    const tokenMap = new Map<string, TokenInfo>();
    tokens.forEach(token => tokenMap.set(token.address, token));
    
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
    
    const [solBalance, accounts] = await Promise.all([
      solBalancePromise,
      accountsPromise
    ]);
    
    const solBalanceInSOL = solBalance / 1_000_000_000;
    const solToken = tokens.find(t => t.symbol === 'SOL');
    if (solToken) {
      solToken.balance = solBalanceInSOL;
    }
    
    tokens.forEach(token => {
      if (token.symbol !== 'SOL') {
        token.balance = 0;
      }
    });
    
    accounts.value.forEach(({ account }) => {
      try {
        const parsedInfo = account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const balance = parsedInfo.tokenAmount.uiAmount;
        
        if (balance > 0 && tokenMap.has(mintAddress)) {
          tokenMap.get(mintAddress)!.balance = balance;
        }
      } catch (e) {
        console.warn('Error processing account in batch update:', e);
      }
    });
  } catch (error) {
    console.error('Error in batch updating token balances:', error);
  }
}