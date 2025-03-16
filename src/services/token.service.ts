// src/services/token.service.ts
import { TokenApiAdapter, tokenApiAdapter } from '@/infrastructure/adapters/token-api.adapter';
import { TokenInfo } from '@/types/token.types';
import { POPULAR_TOKEN_ADDRESSES } from '@/constants/token.constants';
import { showNotification } from '@/utils/notification.utils';

/**
 * Service for token-related operations
 */
export class TokenService {
  private tokenApiAdapter: TokenApiAdapter;
  private cachedTokens: TokenInfo[] = [];
  private cachedPrices: Record<string, number> = {};
  
  constructor(adapter: TokenApiAdapter = tokenApiAdapter) {
    this.tokenApiAdapter = adapter;
  }
  
  /**
   * Get all tokens, with optional caching
   */
  async getTokens(forceRefresh = false): Promise<TokenInfo[]> {
    try {
      // Return cached tokens if available and not forcing refresh
      if (this.cachedTokens.length > 0 && !forceRefresh) {
        return this.cachedTokens;
      }
      
      // Fetch tokens from API
      const tokens = await this.tokenApiAdapter.fetchTokens();
      
      // Fetch token prices
      const priceMap = await this.getTokenPrices();
      
      // Update tokens with prices
      const tokensWithPrices = tokens.map(token => ({
        ...token,
        price: priceMap[token.address] || 0
      }));
      
      // Filter out tokens with no price (likely spam or very low liquidity)
      const validTokens = tokensWithPrices.filter(token => 
        // Keep popular tokens even without price
        POPULAR_TOKEN_ADDRESSES.includes(token.address) || token.price > 0
      );
      
      // Sort by popularity and price
      const sortedTokens = validTokens.sort((a, b) => {
        const aIsPopular = POPULAR_TOKEN_ADDRESSES.includes(a.address);
        const bIsPopular = POPULAR_TOKEN_ADDRESSES.includes(b.address);
        
        if (aIsPopular && !bIsPopular) return -1;
        if (!aIsPopular && bIsPopular) return 1;
        
        // Then sort by market cap (approximated by price)
        return b.price - a.price;
      });
      
      // Cache the result
      this.cachedTokens = sortedTokens;
      
      return sortedTokens;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      showNotification.error(
        'Error fetching tokens',
        'Could not load token list'
      );
      throw error;
    }
  }
  
  /**
   * Get token prices, with optional caching
   */
  async getTokenPrices(forceRefresh = false): Promise<Record<string, number>> {
    try {
      // Return cached prices if available and not forcing refresh
      if (Object.keys(this.cachedPrices).length > 0 && !forceRefresh) {
        return this.cachedPrices;
      }
      
      // Fetch prices from API
      const prices = await this.tokenApiAdapter.fetchTokenPrices();
      
      // Cache the result
      this.cachedPrices = prices;
      
      return prices;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      throw error;
    }
  }
  
  /**
   * Get token balances for a wallet
   */
  async getTokenBalances(walletAddress: string): Promise<Record<string, number>> {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }
      
      return await this.tokenApiAdapter.fetchTokenBalances({ walletAddress });
    } catch (error) {
      console.error('Error fetching token balances:', error);
      showNotification.error(
        'Error fetching balances',
        error instanceof Error ? error.message : 'Could not load token balances'
      );
      throw error;
    }
  }
  
  /**
   * Get a token by symbol
   */
  async getTokenBySymbol(symbol: string): Promise<TokenInfo | undefined> {
    try {
      // Check cached tokens first
      if (this.cachedTokens.length > 0) {
        const token = this.cachedTokens.find(t => t.symbol === symbol);
        if (token) return token;
      }
      
      // If not found in cache, fetch all tokens
      const tokens = await this.getTokens();
      return tokens.find(token => token.symbol === symbol);
    } catch (error) {
      console.error(`Error getting token by symbol ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a token by address
   */
  async getTokenByAddress(address: string): Promise<TokenInfo | undefined> {
    try {
      // Check cached tokens first
      if (this.cachedTokens.length > 0) {
        const token = this.cachedTokens.find(t => t.address === address);
        if (token) return token;
      }
      
      // If not found in cache, fetch all tokens
      const tokens = await this.getTokens();
      return tokens.find(token => token.address === address);
    } catch (error) {
      console.error(`Error getting token by address ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Get popular tokens
   */
  async getPopularTokens(): Promise<TokenInfo[]> {
    try {
      const allTokens = await this.getTokens();
      
      return allTokens.filter(token => 
        POPULAR_TOKEN_ADDRESSES.includes(token.address)
      );
    } catch (error) {
      console.error('Error getting popular tokens:', error);
      throw error;
    }
  }
  
  /**
   * Clear token cache
   */
  clearCache(): void {
    this.cachedTokens = [];
    this.cachedPrices = {};
  }
}

// Export a singleton instance for convenience
export const tokenService = new TokenService();