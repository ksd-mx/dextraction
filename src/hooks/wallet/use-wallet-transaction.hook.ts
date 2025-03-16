// src/hooks/wallet/use-wallet-transaction.hook.ts
import { useState, useCallback } from 'react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { Transaction, Connection } from '@solana/web3.js';
import { config } from '@/config/app-config';
import { showNotification } from '@/store/notification.store';

export function useWalletTransaction() {
  const { 
    connected,
    signTransaction: solanaSignTransaction,
    sendTransaction: solanaSendTransaction 
  } = useSolanaWallet();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Sign a transaction using the connected wallet
  const signTransaction = useCallback(async (transaction: Transaction) => {
    if (!connected || !solanaSignTransaction) {
      throw new Error('Wallet not connected or does not support signing');
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      return await solanaSignTransaction(transaction);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      
      const processedError = error instanceof Error 
        ? error.message.includes('User rejected') 
          ? new Error('Transaction rejected by user')
          : error
        : new Error('Failed to sign transaction');
        
      setError(processedError);
      throw processedError;
    } finally {
      setIsProcessing(false);
    }
  }, [connected, solanaSignTransaction]);

  // Send a transaction using the connected wallet
  const sendTransaction = useCallback(async (transaction: Transaction) => {
    if (!connected || !solanaSendTransaction) {
      throw new Error('Wallet not connected or does not support sending transactions');
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const connection = new Connection(config.solana.rpcUrl);
      const signature = await solanaSendTransaction(transaction, connection);
      
      setLastSignature(signature);
      
      // Show notification
      showNotification({
        type: 'info',
        title: 'TRANSACTION SENT',
        message: `Transaction submitted: ${signature.substring(0, 8)}...`,
        position: 'bottom'
      });
      
      return signature;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      
      const processedError = error instanceof Error 
        ? error.message.includes('User rejected') 
          ? new Error('Transaction rejected by user')
          : error
        : new Error('Failed to send transaction');
      
      setError(processedError);
      
      // Show error notification
      showNotification({
        type: 'error',
        title: 'TRANSACTION FAILED',
        message: processedError.message,
        position: 'bottom'
      });
      
      throw processedError;
    } finally {
      setIsProcessing(false);
    }
  }, [connected, solanaSendTransaction]);

  // Confirm a transaction
  const confirmTransaction = useCallback(async (signature: string) => {
    try {
      const connection = new Connection(config.solana.rpcUrl);
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }
      
      // Show success notification
      showNotification({
        type: 'success',
        title: 'TRANSACTION CONFIRMED',
        message: `Transaction successful: ${signature.substring(0, 8)}...`,
        position: 'bottom'
      });
      
      return true;
    } catch (error) {
      console.error('Transaction confirmation error:', error);
      
      // Show error notification
      showNotification({
        type: 'error',
        title: 'CONFIRMATION FAILED',
        message: error instanceof Error ? error.message : 'Transaction failed to confirm',
        position: 'bottom'
      });
      
      return false;
    }
  }, []);

  return {
    isProcessing,
    lastSignature,
    error,
    signTransaction,
    sendTransaction,
    confirmTransaction
  };
}