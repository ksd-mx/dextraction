import { ApiClient, apiClient } from '@/infrastructure/api.client';
import { TOKEN_API_ENDPOINTS } from '@/infrastructure/api.constants';
import { 
  GetTokensParams, 
  GetTokenPricesParams, 
  GetTokenBalancesParams,
  TokenListResponse,
  TokenPricesResponse,
  TokenBalancesResponse
} from '@/infrastructure/api.types';
import { TokenInfo } from '@/types/token.types';

/**
 * Adapter for token-related API operations
 */
export class TokenApiAdapter {
  private apiClient: ApiClient;
  
  constructor(client: ApiClient = apiClient) {
    this.apiClient = client;
  }
  
  /**
   * Fetch all tokens or filtered by params
   */
  async fetchTokens(params?: GetTokensParams): Promise<TokenInfo[]> {
    try {
      const response = await this.apiClient.get<TokenListResponse>(
        TOKEN_API_ENDPOINTS.TOKENS,
        params
      );
      return response.tokens;
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      throw error;
    }
  }
  
  /**
   * Fetch token prices
   */
  async fetchTokenPrices(params?: GetTokenPricesParams): Promise<Record<string, number>> {
    try {
      const response = await this.apiClient.get<TokenPricesResponse>(
        TOKEN_API_ENDPOINTS.TOKEN_PRICES,
        params
      );
      return response.prices;
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      throw error;
    }
  }
  
  /**
   * Fetch token balances for a wallet
   */
  async fetchTokenBalances(params: GetTokenBalancesParams): Promise<Record<string, number>> {
    try {
      const response = await this.apiClient.get<TokenBalancesResponse>(
        TOKEN_API_ENDPOINTS.TOKEN_BALANCES,
        params
      );
      return response.balances;
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
      throw error;
    }
  }
  
  /**
   * Fetch token by address
   */
  async fetchTokenByAddress(address: string): Promise<TokenInfo | undefined> {
    try {
      const allTokens = await this.fetchTokens();
      return allTokens.find(token => token.address === address);
    } catch (error) {
      console.error(`Failed to fetch token with address ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetch token by symbol
   */
  async fetchTokenBySymbol(symbol: string): Promise<TokenInfo | undefined> {
    try {
      const allTokens = await this.fetchTokens();
      return allTokens.find(token => token.symbol === symbol);
    } catch (error) {
      console.error(`Failed to fetch token with symbol ${symbol}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance for convenience
export const tokenApiAdapter = new TokenApiAdapter();