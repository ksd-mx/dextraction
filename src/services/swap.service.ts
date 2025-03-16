// src/services/swap.service.ts
import { SwapApiAdapter, swapApiAdapter } from '@/infrastructure/adapters/swap-api.adapter';
import { 
  SwapQuoteRequest, 
  SwapTransactionRequest 
} from '@/infrastructure/api.types';
import { SwapQuoteResponse, TransactionResponse } from '@/types/swap.types';
import { TokenInfo } from '@/types/token.types';
import { showNotification } from '@/utils/notification.utils';
import { Transaction, Connection, PublicKey } from '@solana/web3.js';
import { config } from '@/config/app-config';

/**
 * Service for swap-related operations
 */
export class SwapService {
  private swapApiAdapter: SwapApiAdapter;
  
  constructor(adapter: SwapApiAdapter = swapApiAdapter) {
    this.swapApiAdapter = adapter;
  }
  
  /**
   * Get a swap quote
   * 
   * @param fromToken Source token
   * @param toToken Destination token
   * @param amount Amount to swap in token units (not lamports)
   * @param slippagePercent Slippage tolerance in percentage (0.5 = 0.5%)
   */
  async getSwapQuote(
    fromToken: TokenInfo,
    toToken: TokenInfo,
    amount: number,
    slippagePercent: number
  ): Promise<SwapQuoteResponse> {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }
      
      // Convert amount to lamports/smallest unit using token decimals
      const inputDecimals = fromToken.decimals;
      const inputAmount = Math.floor(amount * (10 ** inputDecimals));
      
      // Convert slippage from percentage to basis points (1% = 100 bps)
      const slippageBps = Math.floor(slippagePercent * 100);
      
      const request: SwapQuoteRequest = {
        inputMint: fromToken.address,
        outputMint: toToken.address,
        amount: inputAmount,
        slippageBps,
      };
      
      return await this.swapApiAdapter.fetchSwapQuote(request);
    } catch (error) {
      console.error('Error getting swap quote:', error);
      
      // Show error notification
      showNotification.error(
        'Quote Error',
        error instanceof Error ? error.message : 'Failed to get swap quote',
        { position: 'bottom' }
      );
      
      throw error;
    }
  }
  
  /**
   * Get a swap transaction
   */
  async getSwapTransaction(
    quoteResponse: SwapQuoteResponse,
    userPublicKey: string
  ): Promise<TransactionResponse> {
    try {
      const request: SwapTransactionRequest = {
        quoteResponse,
        userPublicKey,
      };
      
      return await this.swapApiAdapter.fetchSwapTransaction(request);
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      
      // Show error notification
      showNotification.error(
        'Transaction Error',
        error instanceof Error ? error.message : 'Failed to prepare swap transaction',
        { position: 'bottom' }
      );
      
      throw error;
    }
  }
  
  /**
   * Execute a swap with a wallet signing function
   */
  async executeSwap(
    quoteResponse: SwapQuoteResponse,
    walletPublicKey: string,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<string> {
    try {
      // Get the swap transaction
      const transactionResponse = await this.getSwapTransaction(
        quoteResponse,
        walletPublicKey
      );
      
      // Deserialize the transaction
      const swapTransaction = Transaction.from(
        Buffer.from(transactionResponse.swapTransaction, 'base64')
      );
      
      // Connect to the Solana network
      const connection = new Connection(config.solana.rpcUrl);
      
      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      swapTransaction.recentBlockhash = blockhash;
      swapTransaction.feePayer = new PublicKey(walletPublicKey);
      
      // Request signature from the wallet
      const signedTransaction = await signTransaction(swapTransaction);
      
      // Submit the transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      
      // Show success notification
      showNotification.info(
        'TRANSACTION SUBMITTED',
        `Transaction sent: ${signature.substring(0, 8)}...`,
        { position: 'bottom' }
      );
      
      return signature;
    } catch (error) {
      console.error('Error executing swap:', error);
      
      // Show error notification
      showNotification.error(
        'Swap Failed',
        error instanceof Error ? error.message : 'Failed to execute swap',
        { position: 'bottom' }
      );
      
      throw error;
    }
  }
  
  /**
   * Calculate estimated output amount from a quote
   */
  calculateOutputAmount(
    quoteResponse: SwapQuoteResponse,
    toToken: TokenInfo
  ): number {
    const outputDecimals = toToken.decimals;
    return Number(quoteResponse.outAmount) / (10 ** outputDecimals);
  }
  
  /**
   * Confirm a transaction
   */
  async confirmTransaction(signature: string): Promise<boolean> {
    try {
      const connection = new Connection(config.solana.rpcUrl);
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }
      
      // Show success notification
      showNotification.success(
        'TRANSACTION CONFIRMED',
        `Transaction successful: ${signature.substring(0, 8)}...`,
        { position: 'bottom' }
      );
      
      return true;
    } catch (error) {
      console.error('Transaction confirmation error:', error);
      
      // Show error notification
      showNotification.error(
        'CONFIRMATION FAILED',
        error instanceof Error ? error.message : 'Transaction failed to confirm',
        { position: 'bottom' }
      );
      
      return false;
    }
  }
}

// Export a singleton instance for convenience
export const swapService = new SwapService();