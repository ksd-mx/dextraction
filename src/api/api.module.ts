// API module exports for easy importing
import { ApiClient } from './api-client.service';
import { TokenApiService } from './token/token-api.service';
import { SwapApiService } from './swap/swap-api.service';

// Export all API services
export {
  ApiClient,
  TokenApiService,
  SwapApiService,
};

// Create and export default instances
const apiClient = new ApiClient();
const tokenApiService = new TokenApiService();
const swapApiService = new SwapApiService();

export { apiClient, tokenApiService, swapApiService };