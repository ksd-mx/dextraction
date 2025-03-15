import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '@/lib/config';
import { Token } from '@/types/token';

// Extended token interface to include mint address and icon URL
export interface TokenInfo extends Token {
  address: string;  // Mint address
  logoURI?: string; // Token icon URL
  decimals: number; // Token decimals
  tags?: string[];  // Token tags (optional)
}

// Jupiter token interface
interface JupiterToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI: string;
  tags?: string[];
}

/**
 * Fetches token list from Jupiter API
 */
export async function fetchTokens(): Promise<TokenInfo[]> {
  try {
    const response = await fetch('https://token.jup.ag/all');
    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Map Jupiter tokens to our token format
    return data.map((token: JupiterToken) => ({
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
      logoURI: token.logoURI,
      price: 0, // Will be populated later
      balance: 0, // Will be populated later
      tags: token.tags || []
    }));
  } catch (error) {
    console.error('Error fetching tokens:', error);
    throw error;
  }
}

/**
 * Fetches token prices from Jupiter API
 */
export async function fetchTokenPrices(tokens: TokenInfo[]): Promise<Record<string, number>> {
  try {
    // Jupiter price API
    const response = await fetch('https://price.jup.ag/v4/price');
    if (!response.ok) {
      throw new Error(`Failed to fetch token prices: ${response.statusText}`);
    }
    
    const data = await response.json();
    const priceMap: Record<string, number> = {};
    
    // Create a map of token addresses to prices
    for (const token of tokens) {
      const tokenPrice = data.data[token.address];
      if (tokenPrice) {
        priceMap[token.address] = tokenPrice.price;
      }
    }
    
    return priceMap;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return {};
  }
}

/**
 * Gets token balances for a wallet
 */
export async function getTokenBalances(
  walletAddress: string, 
  tokens: TokenInfo[]
): Promise<Map<string, number>> {
  try {
    const connection = new Connection(config.solana.rpcUrl);
    const publicKey = new PublicKey(walletAddress);
    
    // Get SOL balance
    const solBalance = await connection.getBalance(publicKey);
    const solBalanceInSOL = solBalance / 1_000_000_000; // Convert lamports to SOL
    
    // Get token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    const balanceMap = new Map<string, number>();
    
    // Add native SOL
    const solToken = tokens.find(t => t.symbol === 'SOL');
    if (solToken) {
      balanceMap.set(solToken.address, solBalanceInSOL);
    }
    
    // Process token accounts
    for (const { account } of tokenAccounts.value) {
      const parsedInfo = account.data.parsed.info;
      const mintAddress = parsedInfo.mint;
      const balance = parsedInfo.tokenAmount.uiAmount;
      
      if (balance > 0) {
        balanceMap.set(mintAddress, balance);
      }
    }
    
    return balanceMap;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return new Map<string, number>();
  }
}