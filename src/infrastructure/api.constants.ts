// src/infrastructure/api/api.constants.ts

/**
 * API endpoints for token-related operations
 */
export const TOKEN_API_ENDPOINTS = {
    TOKENS: '/api/tokens',
    TOKEN_PRICES: '/api/prices',
    TOKEN_BALANCES: '/api/balances',
  };
  
  /**
   * API endpoints for swap-related operations
   */
  export const SWAP_API_ENDPOINTS = {
    QUOTE: '/api/swaps/quote',
    TRANSACTION: '/api/swaps/transaction',
  };
  
  /**
   * Default slippage value in percentage (0.5%)
   */
  export const DEFAULT_SLIPPAGE = 0.5;
  
  /**
   * Slippage options in percentage
   */
  export const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 5.0];
  
  /**
   * Fee settings
   */
  export const TRADING_FEE_PERCENT = 0.3;
  export const LP_FEE_PERCENT = 0.25;
  export const PROTOCOL_FEE_PERCENT = 0.05;