export const APP_NAME = 'DEXTRACT';

// Network settings
export const SOLANA_NETWORK = 'mainnet-beta'; // or 'testnet' or 'devnet'
export const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

// Fee settings
export const TRADING_FEE_PERCENT = 0.3;
export const LP_FEE_PERCENT = 0.25;
export const PROTOCOL_FEE_PERCENT = 0.05;

// Slippage settings
export const DEFAULT_SLIPPAGE = 0.5;
export const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 5.0];

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
  YIELD_FARMING: false,
  CROSS_CHAIN_DEPOSITS: false,
  LENDING: false,
  CHARTS: true,
};