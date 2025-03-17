// Default popular token addresses on Solana
export const POPULAR_TOKEN_ADDRESSES = [
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP
    '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
    'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ', // DUST
    'ARzG5HLU6u1n8G4VChSuEKpX7BE1apcjV4cKyCfhzJYC', // MYRO
    'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', // HNT
  ];
  
  // Default token pairs for the swap interface
  export const DEFAULT_TOKEN_PAIRS = {
    FROM: 'SOL',
    TO: 'USDC',
  };
  
  // Token list URLs
  export const TOKEN_LIST_URLS = {
    SOLANA: 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json',
    JUPITER: 'https://token.jup.ag/all',
  };
  
  // Native SOL token info
  export const NATIVE_SOL_TOKEN = {
    symbol: 'SOL',
    name: 'Solana',
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  };
  
  // USDC token info
  export const USDC_TOKEN = {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  };