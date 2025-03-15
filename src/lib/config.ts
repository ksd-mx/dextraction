// Environment variables config manager

export const config = {
    solana: {
      rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.testnet.solana.com',
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'testnet',
    },
    tokens: {
      apiKey: process.env.NEXT_PUBLIC_TOKENS_API_KEY || '',
      apiUrl: process.env.NEXT_PUBLIC_TOKENS_API_URL || 'https://token.jup.ag/all',
      maxTokensPerRequest: 100,
      rateLimit: 1000, // milliseconds between requests
    },
    swaps: {
      apiKey: process.env.NEXT_PUBLIC_SWAPS_API_KEY || '',
      apiUrl: process.env.NEXT_PUBLIC_SWAPS_API_URL || 'https://api.jup.ag',
      maxTokensPerRequest: 100,
      rateLimit: 1000, // milliseconds between requests
    },
    coingecko: {
      apiUrl: process.env.NEXT_PUBLIC_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
      apiKey: process.env.NEXT_PUBLIC_COINGECKO_API_KEY || '',
      maxTokensPerRequest: 100
    },
    jupiter: {
      apiUrl: process.env.NEXT_PUBLIC_JUPITER_API_URL || 'https://token.jup.ag'
    },
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME || 'DEXTRACT',
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    fees: {
      tradingFeePercent: Number(process.env.NEXT_PUBLIC_TRADING_FEE_PERCENT || 0.3),
      lpFeePercent: Number(process.env.NEXT_PUBLIC_LP_FEE_PERCENT || 0.25),
      protocolFeePercent: Number(process.env.NEXT_PUBLIC_PROTOCOL_FEE_PERCENT || 0.05),
    },
    features: {
      enableYieldFarming: process.env.NEXT_PUBLIC_ENABLE_YIELD_FARMING === 'true',
      enableCrossChainDeposits: process.env.NEXT_PUBLIC_ENABLE_CROSS_CHAIN_DEPOSITS === 'true',
      enableLending: process.env.NEXT_PUBLIC_ENABLE_LENDING === 'true',
    },
  };