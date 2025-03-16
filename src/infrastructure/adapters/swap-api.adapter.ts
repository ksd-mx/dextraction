// src/infrastructure/adapters/swap-api.adapter.ts
import { ApiClient, apiClient } from '@/infrastructure/api.client';
import { SWAP_API_ENDPOINTS } from '@/infrastructure/api.constants';
import { 
  SwapQuoteRequest, 
  SwapTransactionRequest 
} from '@/infrastructure/api.types';
import { SwapQuoteResponse, TransactionResponse } from '@/types/swap.types';

/**
 * Adapter for swap-related API operations
 */
export class SwapApiAdapter {
  private apiClient: ApiClient;
  
  constructor(client: ApiClient = apiClient) {
    this.apiClient = client;
  }
  
  /**
   * Fetch swap quote from API
   */
  async fetchSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
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
   * Fetch swap transaction from API
   */
  async fetchSwapTransaction(request: SwapTransactionRequest): Promise<TransactionResponse> {
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

// Export a singleton instance for convenience
export const swapApiAdapter = new SwapApiAdapter();