import { ApiClient } from '@/api/api-client.service';
import { TOKEN_API_ENDPOINTS } from '@/api/token/token-api.constants';
import { 
  GetTokensParams, 
  GetTokenPricesParams, 
  GetTokenBalancesParams,
  TokenListResponse,
  TokenPricesResponse,
  TokenBalancesResponse
} from './token-api.types';
import { TokenInfo } from '@/types/token.types';

export class TokenApiService {
  private apiClient: ApiClient;
  
  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || new ApiClient();
  }
  
  /**
   * Get tokens with optional parameters
   */
  async getTokens(params?: GetTokensParams): Promise<TokenInfo[]> {
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
   * Get token prices with optional filtering
   */
  async getTokenPrices(params?: GetTokenPricesParams): Promise<Record<string, number>> {
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
   * Get token balances for a wallet
   */
  async getTokenBalances(params: GetTokenBalancesParams): Promise<Record<string, number>> {
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
   * Get popular tokens
   */
  async getPopularTokens(): Promise<TokenInfo[]> {
    try {
      return this.getTokens({ popular: true });
    } catch (error) {
      console.error('Failed to fetch popular tokens:', error);
      throw error;
    }
  }
  
  /**
   * Get token by symbol
   */
  async getTokenBySymbol(symbol: string): Promise<TokenInfo | undefined> {
    try {
      const allTokens = await this.getTokens();
      return allTokens.find(token => token.symbol === symbol);
    } catch (error) {
      console.error(`Failed to fetch token with symbol ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get token by address
   */
  async getTokenByAddress(address: string): Promise<TokenInfo | undefined> {
    try {
      const allTokens = await this.getTokens();
      return allTokens.find(token => token.address === address);
    } catch (error) {
      console.error(`Failed to fetch token with address ${address}:`, error);
      throw error;
    }
  }
}