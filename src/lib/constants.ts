import { config } from './config';

export const APP_NAME = config.app.name;

// Network settings
export const SOLANA_NETWORK = config.solana.network;
export const SOLANA_RPC_URL = config.solana.rpcUrl;

// Fee settings
export const TRADING_FEE_PERCENT = config.fees.tradingFeePercent;
export const LP_FEE_PERCENT = config.fees.lpFeePercent;
export const PROTOCOL_FEE_PERCENT = config.fees.protocolFeePercent;

// Slippage settings
export const DEFAULT_SLIPPAGE = 0.5;
export const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 5.0];

// Token lists
export const TOKEN_LIST_URL = 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json';

// Local storage keys
export const STORAGE_KEYS = {
  SLIPPAGE: 'dex_slippage',
  TRADE_MODE: 'dex_trade_mode',
  RECENT_TRANSACTIONS: 'dex_recent_transactions',
  FAVORITE_TOKENS: 'dex_favorite_tokens',
};

// Transaction statuses
export const TX_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
};

// Routes
export const ROUTES = {
  HOME: '/',
  SWAP: '/swap',
  POOL: '/pool',
  FARM: '/farm',
  BRIDGE: '/bridge',
  LEND: '/lend',
  SETTINGS: '/settings',
};

// Feature flags (for development)
export const FEATURES = {
  YIELD_FARMING: config.features.enableYieldFarming,
  CROSS_CHAIN_DEPOSITS: config.features.enableCrossChainDeposits,
  LENDING: config.features.enableLending,
  CHARTS: true,
};