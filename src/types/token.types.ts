// Base Token interface
export interface Token {
    symbol: string;
    name: string;
    price: number;
    balance: number;
    address?: string;     // Token mint address
    logoURI?: string;     // Token icon URL
    decimals?: number;    // Token decimals
    tags?: string[];      // Token tags
  }
  
  // Extended token interface with required fields
  export interface TokenInfo extends Token {
    address: string;      // Token mint address (required)
    logoURI?: string;     // Token icon URL
    decimals: number;     // Token decimals (required)
    tags?: string[];      // Token tags
  }
  
  // For backward compatibility until all imports are updated
  export type JupiterToken = TokenInfo;
  
  // Token Price interface
  export interface TokenPrice {
    address: string;      // Token mint address
    symbol?: string;      // Token symbol
    price: number;        // Token price in USD
    timestamp: number;    // Timestamp of price update
  }
  
  // Token Balance interface
  export interface TokenBalance {
    address: string;      // Token mint address
    balance: number;      // Token balance
  }
  
  // Token List interface
  export interface TokenList {
    name: string;
    logoURI: string;
    tokens: TokenInfo[];
  }