import { ApiClient } from '../api-client.service';
import { SWAP_API_ENDPOINTS } from './swap-api.constants';
import { 
  SwapQuoteRequest, 
  SwapTransactionRequest 
} from './swap-api.types';
import { SwapQuoteResponse, TransactionResponse } from '@/types/swap.types';

export class SwapApiService {
  private apiClient: ApiClient;
  
  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || new ApiClient();
  }
  
  /**
   * Get swap quote from dextract-api
   */
  async getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    try {
      return await this.apiClient.get<SwapQuoteResponse>(
        SWAP_API_ENDPOINTS.QUOTE,
        request
      );
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw error;
    }
  }
  
  /**
   * Get swap transaction from dextract-api
   */
  async getSwapTransaction(request: SwapTransactionRequest): Promise<TransactionResponse> {
    try {
      return await this.apiClient.post<TransactionResponse>(
        SWAP_API_ENDPOINTS.TRANSACTION,
        request
      );
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      throw error;
    }
  }
}